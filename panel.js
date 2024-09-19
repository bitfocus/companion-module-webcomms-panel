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
		this.config = config
		this.channelChoices = []
		this.status = {};
		this.updateStatus('connecting');

		// Get env variables from server
		const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } = await fetch('https://www.webcomms.net/supabaseEnv').then(res => res.json())
		this.supabase = supabase.createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY)

		// Continue to config if intercom name is set else return bad config
		if (this.config.intercomName !== '') {

			// Get intercom config from supabase
			this.supabaseIntercomConfig = await this.supabase.from('intercoms').select('*').eq('name', this.config.intercomName).single()
			if (this.supabaseIntercomConfig.error && this.supabaseIntercomConfig.error.code === "PGRST116") {
				this.updateStatus('bad_config', "Intercom not found")
				return
			}

			this.intercomConfig = this.supabaseIntercomConfig.data.config.config

			// Set up channel choices
			this.channelChoices = []
			this.intercomConfig.channels.map((ch, index) => {
				this.channelChoices.push({ id: index, label: ch });
			})

			// Set up role choices
			this.roleChoices = []
			this.intercomConfig.roles.map((role, index) => { this.roleChoices.push({ id: index, label: role }) })

		} else {
			this.updateStatus('bad_config', "Intercom name not set")
			return
		}

		// Check if user ID is set
		if (this.config.userID !== "") {
			const userExists = await this.supabase.from('user_ids').select('id').eq('id', this.config.userID).single()
			if (userExists.error && userExists.error.code === "PGRST116") {
				this.updateStatus('bad_config', "Companion ID not found")
				return
			} else if (userExists.error && userExists.error.code === "22P02") {
				this.updateStatus('bad_config', "Invalid User ID")
				return
			}

			this.channel = this.supabase.channel(this.config.intercomName)

			this.channel.on('broadcast', { event: this.config.companionIdentity }, (msg) => {
				this.log('info', "Message received")
				switch (msg.payload.event) {
					case "talkStatusChange":
						this.log('info', "Talk status change event received")
						this.status[msg.payload.channelID].talking = msg.payload.talking
						this.checkFeedbacks('talkActive')
						break;

					case "listenStatusChange":
						this.log('info', "Listen status change event received")
						this.status[msg.payload.channelID].listening = msg.payload.listening
						this.checkFeedbacks('listenActive')
						break;

					case "volumeChange":
						this.log('info', "Volume change event received")
						this.status[msg.payload.channelID].volume = msg.payload.volume
						this.checkFeedbacks('volume')
						break;

					case "companionSyncResponse":
						this.log('info', "Companion sync response received")
						this.status = msg.payload.state
						this.log('debug', JSON.stringify(msg.payload.state))
						this.updateFeedbacks()
						this.checkFeedbacks('talkActive', 'listenActive', 'volume')
						break;

					default:
						console.log('info', "Unknown event received: " + msg.payload.event)
						break;
				}
			})

			this.channel.subscribe()


		} else {
			this.updateStatus('bad_config', "User ID not set")
			return
		}


		if (!this.config.role !== undefined) {

			await this.channel.send({
				type: 'broadcast',
				event: this.config.companionIdentity,
				payload: {
					event: 'companionSyncRequest',
					role: this.config.role
				}
			})

			console.log('info', "request for companion sync sent")

		} else {
			this.updateStatus('bad_config', "Role not set")
		}

		this.updateStatus('ok')
		this.updateActions() // export actions
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.init(config);

	}


	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'intercomName',
				label: 'Intercom Name',
				width: 12,
				default: ''
			},
			{
				type: 'textinput',
				id: 'companionIdentity',
				label: 'Companion Identity',
				width: 12,
				default: ''
			},
			{
				type: 'dropdown',
				label: 'Role',
				id: 'role',
				width: 12,
				default: '',
				choices: this.roleChoices
			}
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

runEntrypoint(PanelInstance, UpgradeScripts);