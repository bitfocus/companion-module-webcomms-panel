const { InstanceBase, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const supabase = require('@supabase/supabase-js')

const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

/**
 * @typedef CompanionEventPayload
 * @param {string} event
 * @param {Record<string, Channel>} state
 * @param {string} [roleId]
 */

/**
 * @typedef Channel
 * @param {TemplateChannel} templateChannel
 * @param {'disabled' | 'listenOnly' | 'talkOnly' | 'duplex'} localPermissions
 * @param {boolean} talkActivity
 * @param {number} volume
 * @param {boolean} listenActive
 * @param {boolean} talkActive
 */

/**
 * @typedef TemplateChannel
 * @param {string} channelId
 * @param {string} channelName
 * @param {number} orderIndex
 * @param {string} [sendTrackId]
 * @param {Record<string, RemoteIntercomParticipant>} remoteIntercomParticipants
 */

/**
 * @typedef RemoteIntercomParticipant
 * @param {string} userId
 * @param {string} userName
 * @param {boolean} talking
 * @param {boolean} listening
 * @param {number} volume
 * @param {string} trackId
 * @param {'disabled' | 'listenOnly' | 'talkOnly' | 'duplex'} remotePermissions
 */

class PanelInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		// Init config
		this.log('info', 'Initialising...')
		this.config = config
		this.channelChoices = []
		this.roleChoices = []
		this.state = {}
		this.updateStatus('connecting')

		// Get env variables from server
		const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } = await fetch('https://www.webcomms.net/supabaseEnv').then((res) => res.json())
		this.log('debug', 'Received env variables from server')
		this.log('debug', PUBLIC_SUPABASE_URL)
		this.log('debug', PUBLIC_SUPABASE_KEY)

		this.supabase = supabase.createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY)
		this.log('debug', 'Created supabase client')

		this.companionSyncTimeout;

		// Check if user ID is set
		if (this.config.companionIdentity !== '') {
			const userExists = await this.supabase
				.rpc('check_companion_id_exists', { input_companion_id: this.config.companionIdentity })
			if (userExists.error) {
				this.log('error', userExists.error.message)
				this.updateStatus('bad_config', userExists.error.message)
				return
			} else if (userExists.data) {
				this.log('info', 'Companion ID found')
			} else if (!userExists.data) {
				this.log('error', 'Companion ID not found')
				this.updateStatus('bad_config', 'Companion Identity not found')
				return
			}

			this.log('info', 'Connecting to intercom')
			this.channel = this.supabase.channel(this.config.intercomName)

			this.log('info', 'Configuring functions')


			this.channel.on('broadcast', { event: this.config.companionIdentity }, (companionEventPayload) => this.handleSupabaseBroadcast(companionEventPayload))

			this.log('info', 'Listening to intercom')
			this.channel.subscribe()
		} else {
			this.updateStatus('bad_config', 'Companion Identity is not set')
			return
		}

		// Continue to config if intercom name is set else return bad config
		if (this.config.intercomName !== '') {
			// Get intercom config from supabase
			this.log('info', 'Attempting to fetch intercom configuration')
			this.supabaseIntercomConfig = await this.supabase
				.from('intercomsv2')
				.select('*')
				.eq('name', this.config.intercomName)
				.single()
			if (this.supabaseIntercomConfig.error && this.supabaseIntercomConfig.error.code === 'PGRST116') {
				this.log('error', 'Intercom not found')
				this.log('error', JSON.stringify(this.supabaseIntercomConfig))
				this.updateStatus('bad_config', 'Intercom not found')
				return
			}

			this.intercomConfig = this.supabaseIntercomConfig.data

			this.log('info', 'Intercom configuration fetched and loaded')

			// Set up channel choices
			Object.values(this.intercomConfig.templateChannels).map((ch, index) => {
				this.channelChoices.push({ id: ch.channelId, label: ch.channelName })
			})

			this.channelChoices.sort((a, b) => {
				if (a.label < b.label) return -1
				if (a.label > b.label) return 1
				return 0
			})
			this.log('info', 'Channel choices set')

			// Set up role choices
			Object.values(this.intercomConfig.matrix).map((role, index) => {
				this.roleChoices.push({ id: role.roleId, label: role.roleName })
			})

			this.roleChoices.sort((a, b) => {
				if (a.label < b.label) return -1
				if (a.label > b.label) return 1
				return 0
			})
			this.log('info', 'Role choices set')
		} else {
			this.updateStatus('bad_config', 'Intercom name not set')
			return
		}


		this.updateStatus('Syncing')
		await this.requestCompanionSync()
		this.updateActions() // export actions
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updateStatus('ok')
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.init(config)
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'companionIdentity',
				label: 'Companion Identity',
				width: 12,
				default: '',
			},
			{
				type: 'textinput',
				id: 'intercomName',
				label: 'Intercom Name',
				width: 12,
				default: '',
			},
			{
				type: 'static-text',
				id: 'roleInstructions',
				width: 12,
				label: 'Selecting your Role',
				value: 'Role options will populate once the Companion Identity and Intercom Name are set and saved',
			},
			{
				type: 'dropdown',
				id: 'roleId',
				label: 'Role',
				width: 12,
				default: 0,
				choices: this.roleChoices,
			},
		]
	}

	async handleSupabaseBroadcast(broadcastEvent) {
		this.log('info', 'Handling broadcast event: ' + JSON.stringify(broadcastEvent))
		if (!this.state.channels && !['companionSyncResponse', 'companionSyncRequest'].includes(broadcastEvent.payload.event) && !this.companionSyncTimeout) {
			this.log('info', 'Broadcast event is not a companion sync response, requesting companion sync')
			this.requestCompanionSync();

		}

		switch (broadcastEvent.payload.event) {
			case 'talkStatusChange':
				this.log('info', 'Talk status change event received: ' + JSON.stringify(broadcastEvent))
				this.state.channels[broadcastEvent.payload.state.templateChannel.channelId] = broadcastEvent.payload.state
				this.checkFeedbacks('talkActive')
				break

			case 'listenStatusChange':
				this.log('info', 'Listen status change event received')
				this.state.channels[broadcastEvent.payload.state.templateChannel.channelId] = broadcastEvent.payload.state
				this.checkFeedbacks('listenActive')
				break

			case 'volumeChange':
				this.log('info', 'Volume change event received')
				this.state.channels[broadcastEvent.payload.state.templateChannel.channelId] = broadcastEvent.payload.state
				this.setVariableValues({ [broadcastEvent.payload.state.templateChannel.channelName.replaceAll(' ', '_')]: broadcastEvent.payload.state.volume })
				this.checkFeedbacks('listenActive')
				break

			case 'companionSyncResponse':
				this.log('info', 'Companion sync response received')
				this.log('debug', JSON.stringify(broadcastEvent))
				this.updateStatus('Syncing')
				this.state = broadcastEvent.payload.state
				this.updateActions()
				this.updateFeedbacks()
				this.checkFeedbacks('talkActive', 'listenActive')
				this.updateVariableDefinitions()
				clearTimeout(this.companionSyncTimeout)
				this.updateStatus('ok')
				break

			case 'companionSyncRequest':
				break

			default:
				this.log('info', 'Unknown event received: ' + broadcastEvent.payload.event)
				break
		}
	}

	async requestCompanionSync() {
		if (!this.config.roleId !== undefined) {
			this.log('info', 'Sending companion sync request: ' + JSON.stringify(this.config))
			await this.channel.send({
				type: 'broadcast',
				event: this.config.companionIdentity,
				payload: {
					event: 'companionSyncRequest',
					roleId: this.config.roleId,
				},
			})

			this.companionSyncTimeout = setTimeout(async () => {
				if (this.state.channels === undefined) {
					this.log('info', 'Companion sync timed out, trying again')
					await this.requestCompanionSync()
				}
			}, 10000)
		} else {
			this.updateStatus('bad_config', 'Role not set')
		}
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

}

runEntrypoint(PanelInstance, UpgradeScripts)
