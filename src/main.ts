import {
	InstanceBase,
	runEntrypoint,
	InstanceStatus,
	SomeCompanionConfigField,
	CompanionVariableValues,
	CompanionVariableDefinition,
} from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'

import type {
	Channel,
	ChannelChoice,
	IntercomDataChannelBroadcast,
	Role,
	RoleChoice,
	SupabaseEnvVars,
	TemplateChannel,
} from './types.d.ts'
import type { Database } from './supabase.js'
import { createClient, RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig // Setup in init()

	channelChoices: ChannelChoice[] = []
	roleChoices: RoleChoice[] = []
	state: Role | undefined

	supabase: SupabaseClient<Database> | undefined
	supabaseIntercomConfig: Database['public']['Tables']['intercomsv2']['Row'] | undefined
	intercomDataChannel: RealtimeChannel | undefined

	companionSyncTimeout: NodeJS.Timeout | undefined

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.log('info', 'Initializing module')
		this.updateStatus(InstanceStatus.Connecting)
		this.config = config

		const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } = await this.fetchSupabaseEnvVars()
		this.log('debug', 'Receieved env vars from the server')
		this.log('debug', PUBLIC_SUPABASE_URL)
		this.log('debug', PUBLIC_SUPABASE_KEY)

		this.supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY)
		this.log('debug', 'Created Supabase client')

		/** Check that the preloaded companion ID exists in the database */
		if (this.config.companionIdentity !== '') {
			const userExists = await this.checkCompanionIDExists(this.config.companionIdentity)
			if (!userExists) {
				this.updateStatus(InstanceStatus.BadConfig, 'Companion ID not found')
				return
			}
		}

		/** Get intercom config from supabase */
		this.supabaseIntercomConfig = await this.getSupabaseIntercomConfig()
		if (!this.supabaseIntercomConfig) {
			this.updateStatus(InstanceStatus.BadConfig, 'Intercom config not found')
			return
		}

		this.log('info', 'Intercom configuration fetched and loaded')
		this.log('info', 'Connecting to intercom')

		this.intercomDataChannel = this.supabase.channel(this.supabaseIntercomConfig.name)
		this.intercomDataChannel
			.on('broadcast', { event: this.config.companionIdentity }, (companionEventPayload) => {
				const payload = companionEventPayload as IntercomDataChannelBroadcast
				this.handleDataChannelBroadcast(payload).catch((error) => {
					this.log('error', error)
				})
			})
			.subscribe()

		await this.requestCompanionSync()
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	async fetchSupabaseEnvVars(): Promise<SupabaseEnvVars> {
		const envVarRequest = await fetch('https://www.webcomms.net/supabaseEnv')
		const data = (await envVarRequest.json()) as SupabaseEnvVars
		const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } = data

		return { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY }
	}

	async checkCompanionIDExists(companionID: string): Promise<boolean> {
		if (!this.supabase) {
			this.log('error', 'Supabase client not found')
			return false
		}

		const userExists = await this.supabase.rpc('check_companion_id_exists', { input_companion_id: companionID })

		if (userExists.error) {
			this.log('error', userExists.error.message)
			return false
		} else if (userExists.data) {
			this.log('info', 'Companion ID found')
			return true
		} else if (!userExists.data) {
			this.log('error', 'Companion ID not found')
			return false
		}

		return false
	}

	async getSupabaseIntercomConfig(): Promise<Database['public']['Tables']['intercomsv2']['Row'] | undefined> {
		if (!this.supabase) {
			this.log('error', 'Supabase client not found')
			return
		}
		this.log('info', 'Attempting to fetch intercom configuration')
		const { data: intercomConfig, error } = await this.supabase
			.from('intercomsv2')
			.select('*')
			.eq('name', this.config.intercomName)
			.single()

		if (error) {
			this.log('error', error.message)
			this.updateStatus(InstanceStatus.BadConfig, error.message)
			return
		} else {
			const typedIntercomConfig = intercomConfig as Database['public']['Tables']['intercomsv2']['Row']
			this.channelChoices = Object.values(JSON.parse(JSON.stringify(typedIntercomConfig.templateChannels))).map(
				(templateChannel) => {
					const tempChannel = templateChannel as TemplateChannel
					return {
						id: tempChannel.channelId,
						label: tempChannel.channelName,
					}
				},
			)

			this.channelChoices.sort((a, b) => {
				return a.label.localeCompare(b.label)
			})

			this.setVariableDefinitions(
				Object.values(JSON.parse(JSON.stringify(typedIntercomConfig.templateChannels))).map((channel) => {
					const tempChannel = channel as TemplateChannel
					return {
						variableId: tempChannel.channelId,
						name: tempChannel.channelName + ' Volume',
						variableType: 'number',
					}
				}),
			)

			return intercomConfig
		}
	}

	async handleDataChannelBroadcast(broadcastEvent: IntercomDataChannelBroadcast): Promise<void> {
		this.log('warn', JSON.stringify(broadcastEvent))
		switch (broadcastEvent.intercomEvent) {
			case 'talkStatusChange': {
				if (!this.state) return

				const talkPayload = broadcastEvent.payload as Channel

				const channel = this.state.channels[talkPayload.templateChannel.channelId]

				channel.talkActive = talkPayload.talkActive

				this.checkFeedbacks('talkStatus')
				break
			}

			case 'listenStatusChange': {
				if (!this.state) return

				const listenPayload = broadcastEvent.payload as Channel

				const channel = this.state.channels[listenPayload.templateChannel.channelId]
				if (!channel) return

				channel.listenActive = listenPayload.listenActive

				this.checkFeedbacks('listenStatus')
				break
			}

			case 'channelActivityStatusChange': {
				if (!this.state) return

				this.log('warn', JSON.stringify(broadcastEvent))

				const talkActivityStatusPayload = broadcastEvent.payload as Channel
				const channel = this.state.channels[talkActivityStatusPayload.templateChannel.channelId]

				if (!channel) return

				channel.talkActivity = !talkActivityStatusPayload.talkActivity

				this.checkFeedbacks('channelActivity')
				break
			}

			case 'volumeChange': {
				if (!this.state) return

				const volumePayload = broadcastEvent.payload as Channel

				const channel = this.state.channels[volumePayload.templateChannel.channelId]
				if (!channel) return

				channel.volume = volumePayload.volume

				this.setVariableValues(this.generateVariableValues())
				break
			}

			case 'companionSyncResponse':
				this.state = broadcastEvent.payload as Role
				this.log('info', 'Companion sync response received')
				this.log('debug', JSON.stringify(this.state))

				this.updateActions()
				this.updateFeedbacks()
				this.checkFeedbacks('talkStatus', 'listenStatus', 'volume')
				this.log('info', 'generating variable definitions')
				this.updateVariableDefinitions()
				this.setVariableValues(this.generateVariableValues())

				clearTimeout(this.companionSyncTimeout)
				this.updateStatus(InstanceStatus.Ok)
				break

			case 'companionSyncRequest':
				break

			default:
				this.log('info', 'Unknown event received: ' + broadcastEvent.intercomEvent)
				break
		}
	}

	async requestCompanionSync(): Promise<void> {
		if (!this.intercomDataChannel) {
			this.log('error', 'Intercom data channel not found')
			return
		}

		const payload: IntercomDataChannelBroadcast<'companionSyncRequest'> = {
			type: 'broadcast',
			event: this.config.companionIdentity,
			intercomEvent: 'companionSyncRequest',
			payload: undefined,
		}

		await this.intercomDataChannel.send(payload)

		this.companionSyncTimeout = setTimeout(() => {
			if (this.state === undefined) {
				this.log('info', 'Companion sync timed out, trying again')
				this.requestCompanionSync().catch((error) => {
					this.log('error', error)
				})
			}
		}, 2000)
	}

	generateVariableDefinitions(): CompanionVariableDefinition[] {
		if (!this.supabaseIntercomConfig || !this.state || !this.state.channels) {
			return []
		}
		const variableDefinitions: CompanionVariableDefinition[] = Object.values(this.state.channels)
			.map((channel): CompanionVariableDefinition | null => {
				if (
					!this.supabaseIntercomConfig ||
					!this.supabaseIntercomConfig.templateChannels ||
					!channel ||
					!channel.templateChannel
				) {
					this.log('error', 'Invalid state')
					this.log('error', JSON.stringify(channel))
					return null
				}

				const templateChannels = Object.values(this.supabaseIntercomConfig.templateChannels)

				// Type guard to ensure templateChannels is an object and not null
				if (templateChannels.length > 0 && typeof templateChannels[0] === 'object') {
					const templateChannel = templateChannels.find((ch) => ch.channelId === channel.templateChannel.channelId)

					return {
						variableId: templateChannel.channelName.replaceAll(' ', '_') + '_volume',
						name: templateChannel.channelName + ' Volume',
					}
				} else {
					console.warn('templateChannels is not an object:', templateChannels)
					return null
				}
			})
			.filter((channel): channel is CompanionVariableDefinition => channel !== null)

		return variableDefinitions
	}

	generateVariableValues(): CompanionVariableValues {
		const variableValues: CompanionVariableValues = {}

		if (!this.supabaseIntercomConfig || !this.state || !this.state.channels) {
			return {}
		}

		Object.values(this.state.channels).forEach((channel) => {
			variableValues[channel.templateChannel.channelName.replaceAll(' ', '_') + '_volume'] = channel.volume
		})

		return variableValues
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
