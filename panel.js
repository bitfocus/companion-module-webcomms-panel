const { InstanceBase, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const supabase = require('@supabase/supabase-js')

const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

/**
 * @typedef {Object} companionEventPayload
 * @property {String} channelName
 * @property {Number} channelID
 * @property {"talkStatusChange" | "listenStatusChange" | "volumeChange"} event
 * @property {Boolean} [talking]
 * @property {Boolean} [listening]
 * @property {Number} [volume]
 *
 * @typedef {Object} companionEvent
 * @property {String} event
 * @property {companionEventPayload} payload
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
		const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } = await fetch('https://www.webcomms.net/supabaseEnv').then(
			(res) => res.json()
		)
		this.log('debug', 'Received env variables from server')
		this.log('debug', PUBLIC_SUPABASE_URL)
		this.log('debug', PUBLIC_SUPABASE_KEY)

		this.supabase = supabase.createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY)
		this.log('debug', 'Created supabase client')

		// Continue to config if intercom name is set else return bad config
		if (this.config.intercomName !== '') {
			// Get intercom config from supabase
			this.log('info', 'Attempting to fetch intercom configuration')
			this.supabaseIntercomConfig = await this.supabase
				.from('intercoms')
				.select('*')
				.eq('name', this.config.intercomName)
				.single()
			if (this.supabaseIntercomConfig.error && this.supabaseIntercomConfig.error.code === 'PGRST116') {
				this.log('error', 'Intercom not found')
				this.log('error', JSON.stringify(this.supabaseIntercomConfig))
				this.updateStatus('bad_config', 'Intercom not found')
				return
			}

			this.intercomConfig = this.supabaseIntercomConfig.data.config.config
			this.log('info', 'Intercom configuration fetched and loaded')

			// Set up channel choices
			this.intercomConfig.channels.map((ch, index) => {
				this.channelChoices.push({ id: index, label: ch })
			})
			this.log('info', 'Channel choices set')

			// Set up role choices
			this.intercomConfig.roles.map((role, index) => {
				this.roleChoices.push({ id: index, label: role })
			})
			this.log('info', 'Role choices set')
		} else {
			this.updateStatus('bad_config', 'Intercom name not set')
			return
		}

		// Check if user ID is set
		if (this.config.companionIdentity !== '') {
			const userExists = await this.supabase
				.from('companion_ids')
				.select('companion_id')
				.eq('companion_id', this.config.companionIdentity)
				.single()
			if (userExists.error && userExists.error.code === 'PGRST116') {
				this.log('error', 'Companion ID not found')
				this.log('error', JSON.stringify(userExists))
				this.updateStatus('bad_config', 'Companion ID not found')
				return
			} else if (userExists.error && userExists.error.code === '22P02') {
				this.log('error', 'Invalid User ID')
				this.log('error', JSON.stringify(userExists))
				this.updateStatus('bad_config', 'Invalid User ID')
				return
			} else if (userExists.data) {
				this.log('info', 'Companion ID found')
			}

			this.log('info', 'Connecting to intercom')
			this.channel = this.supabase.channel(this.config.intercomName)

			this.log('info', 'Configuring functions')
			this.channel.on('broadcast', { event: this.config.companionIdentity }, (msg) => {
				this.log('info', 'Message received')
				switch (msg.payload.event) {
					case 'talkStatusChange':
						this.log('info', 'Talk status change event received')
						this.state[msg.payload.channelID].talking = msg.payload.talking
						this.checkFeedbacks('talkActive')
						break

					case 'listenStatusChange':
						this.log('info', 'Listen status change event received')
						this.state[msg.payload.channelID].listening = msg.payload.listening
						this.checkFeedbacks('listenActive')
						break

					case 'volumeChange':
						this.log('info', 'Volume change event received')
						this.state[msg.payload.channelID].volume = msg.payload.volume
						this.setVariableValues({ ['volume' + msg.payload.channelID]: msg.payload.volume })
						break

					case 'companionSyncResponse':
						this.log('info', 'Companion sync response received')
						this.state = msg.payload.state
						this.log('debug', JSON.stringify(msg.payload.state))
						this.updateActions()
						this.updateFeedbacks()
						this.checkFeedbacks('talkActive', 'listenActive', 'volume')
						this.updateVariableDefinitions()
						this.updateStatus('ok')
						break

					case 'companionSyncRequest':
						break

					default:
						this.log('info', 'Unknown event received: ' + msg.payload.event)
						break
				}
			})

			this.log('info', 'Listening to intercom')
			this.channel.subscribe()
		} else {
			this.updateStatus('bad_config', 'User ID not set')
			return
		}

		if (!this.config.roleID !== undefined) {
			this.log('info', 'Sending companion sync request')
			await this.channel.send({
				type: 'broadcast',
				event: this.config.companionIdentity,
				payload: {
					event: 'companionSyncRequest',
					roleID: this.config.roleID,
				},
			})
		} else {
			this.updateStatus('bad_config', 'Role not set')
		}

		this.updateStatus('Syncing')
		this.updateActions() // export actions
		this.updateFeedbacks()
		this.updateVariableDefinitions()
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
				type: 'dropdown',
				id: 'roleID',
				label: 'Role',
				width: 12,
				default: 0,
				choices: this.roleChoices,
			},
		]
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
