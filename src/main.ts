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
	PGM,
	PGMChoice,
	IntercomDataChannelBroadcast,
	Role,
	RoleChoice,
	SupabaseEnvVars,
	IntercomConfigWithRelations,
	Globals,
} from './types.d.ts'
import type { Database } from './supabase.js'
import { createClient, RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig // Setup in init()

	channelChoices: ChannelChoice[] = []
	pgmChoices: PGMChoice[] = []
	roleChoices: RoleChoice[] = []
	state: Role | undefined
	globals: Globals = {
		globalMute: false,
		globalDeafen: false,
	}

	supabase: SupabaseClient<Database> | undefined
	supabaseIntercomConfig: IntercomConfigWithRelations | undefined
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
		if (this.supabaseIntercomConfig === undefined) {
			this.updateStatus(InstanceStatus.BadConfig, 'Intercom config not found')
			return
		}

		this.log('info', 'Intercom configuration fetched and loaded')
		this.log('info', 'Connecting to intercom')

		this.intercomDataChannel = this.supabase.channel(this.supabaseIntercomConfig.name)
		this.intercomDataChannel
			.on('broadcast', { event: this.config.companionIdentity }, (companionEventPayload) => {
				const payload = companionEventPayload as IntercomDataChannelBroadcast
				this.handleDataChannelBroadcast(payload).catch((e) => {
					this.log('error', e)
				})
			})
			.subscribe()

		await this.requestCompanionSync()

		this.updateStatus(InstanceStatus.Ok)
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.state = undefined // Reset state on config update
		await this.init(config)
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

	async getSupabaseIntercomConfig(): Promise<IntercomConfigWithRelations | undefined> {
		if (!this.supabase) {
			this.log('error', 'Supabase client not found')
			return
		}
		this.log('info', 'Attempting to fetch intercom configuration')
		const { data: intercomConfig, error } = await this.supabase
			.from('intercoms')
			.select('*, channels(*), pgms(*), roles(*)')
			.eq('name', this.config.intercomName)
			.single()

		if (error) {
			this.log('error', error.message)
			this.updateStatus(InstanceStatus.BadConfig, error.message)
			return
		} else if (!intercomConfig) {
			return undefined
		} else {
			this.log('info', JSON.stringify(intercomConfig))
			this.channelChoices = Array.from(intercomConfig.channels).map((ch) => {
				if (!ch.id || !ch.name) throw new Error('Channel id or name does not exist')
				return { id: ch.id, label: ch.name }
			})

			this.channelChoices.sort((a, b) => {
				return a.label.localeCompare(b.label)
			})

			this.pgmChoices = Array.from(intercomConfig.pgms).map((pgm) => {
				if (!pgm.id || !pgm.name) throw new Error('PGM id or name does not exist')
				return { id: pgm.id, label: pgm.name }
			})

			this.pgmChoices.sort((a, b) => {
				return a.label.localeCompare(b.label)
			})

			this.setVariableDefinitions(this.generateVariableDefinitions())

			return intercomConfig as IntercomConfigWithRelations
		}
	}

	async handleDataChannelBroadcast(broadcastEvent: IntercomDataChannelBroadcast): Promise<void> {
		this.log('warn', JSON.stringify(broadcastEvent))
		switch (broadcastEvent.intercomEvent) {
			case 'companionSyncResponse':
				if (!this.state || !this.globals) {
					this.state = broadcastEvent.payload
					this.globals = broadcastEvent.globals

					this.updateActions()
					this.updateFeedbacks()
					this.updateVariableDefinitions()
				}

				this.state = broadcastEvent.payload
				this.globals = broadcastEvent.globals
				this.log('info', 'Companion sync response received')
				this.log('debug', JSON.stringify(this.state))

				this.checkFeedbacks('talkStatus', 'listenStatus', 'channelActivity', 'pgmHidden', 'globalMute', 'globalDeafen')
				this.setVariableValues(this.generateVariableValues())

				if (this.companionSyncTimeout) {
					clearTimeout(this.companionSyncTimeout)
				}
				this.updateStatus(InstanceStatus.Ok)
				break

			case 'companionSyncRequest':
				break

			default:
				this.log('info', 'Unknown event received: ' + broadcastEvent)
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
		const variableDefinitions: CompanionVariableDefinition[] = []

		this.state.channels.forEach((channel) => {
			if (!this.supabaseIntercomConfig || !this.supabaseIntercomConfig.channels || !channel) {
				this.log('error', 'Invalid state')
				this.log('error', JSON.stringify(channel))
				return
			}

			// Type guard to ensure templateChannels is an object and not null
			if (this.supabaseIntercomConfig.channels && this.supabaseIntercomConfig.channels.length > 0) {
				this.log('info', this.supabaseIntercomConfig.channels && this.supabaseIntercomConfig.channels.length > 0)
				const globalChannel = this.supabaseIntercomConfig.channels.find((ch: Channel) => ch.id === channel.id)
				this.log('info', JSON.stringify(channel))

				if (!globalChannel) return

				variableDefinitions.push({
					variableId: globalChannel.name.replaceAll(' ', '_') + '_volume',
					name: globalChannel.name + ' Volume',
				})
			} else {
				console.warn('templateChannels is not an object:', this.supabaseIntercomConfig.channels)
				return
			}
		})

		this.state.pgms.forEach((pgm) => {
			if (!this.supabaseIntercomConfig || !this.state || !this.state.pgms) return

			const globalPGM: PGM | undefined = this.supabaseIntercomConfig.pgms.find(
				(globalPGM: PGM) => globalPGM.id === pgm.id,
			)
			if (!globalPGM) return

			variableDefinitions.push({
				variableId: globalPGM.name.replaceAll(' ', '_') + '_volume',
				name: globalPGM.name + ' Volume',
			})
			return
		})

		this.log('warn', 'vardefs')
		this.log('warn', JSON.stringify(variableDefinitions))
		return variableDefinitions
	}

	generateVariableValues(): CompanionVariableValues {
		const variableValues: CompanionVariableValues = {}

		if (!this.supabaseIntercomConfig || !this.state) {
			return {}
		}

		if (this.state.channels && this.state.channels.length > 0) {
			this.state.channels.forEach((channel) => {
				const channelName = this.supabaseIntercomConfig.channels.find((ch: Channel) => ch.id === channel.id) as
					| Channel
					| undefined
				if (!channelName) return
				variableValues[channelName.name.replaceAll(' ', '_') + '_volume'] = channel.volume
			})
		}

		if (this.state.pgms && this.state.pgms.length > 0) {
			this.state.pgms.forEach((pgm) => {
				const globalPGM: PGM | undefined = this.supabaseIntercomConfig.pgms.find(
					(globalPGM: PGM) => globalPGM.id === pgm.id,
				)
				if (!globalPGM) return
				variableValues[globalPGM.name.replaceAll(' ', '_') + '_volume'] = pgm.volume
			})
		}

		return variableValues
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
