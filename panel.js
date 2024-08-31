const { InstanceBase, runEntrypoint, combineRgb } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const supabase = require('@supabase/supabase-js')

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
		const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } = await fetch('https://svelte5.webcomms.net/supabaseEnv').then(res => res.json())
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
		this.setActionDefinitions({
			activateTalk: {
				name: 'Toggle talk on a channel',
				options: [
					{
						type: 'dropdown',
						label: "Channel",
						id: "channel",
						choices: this.channelChoices
					}
				],
				callback: async (event) => {

					/**@type {companionEvent} changeObj */
					const changeObj = {
						type: 'broadcast',
						event: this.config.companionIdentity,
						payload: {
							event: 'talkStatusChange',
							channelName: this.intercomConfig.matrix[this.config.role].channels[event.options.channel].channelName,
							channelID: event.options.channel,
							talking: !this.intercomConfig.matrix[this.config.role].channels[event.options.channel].talking
						}
					}

					await this.channel.send(
						changeObj
					)

					this.intercomConfig.matrix[this.config.role].channels[event.options.channel].talking = !this.intercomConfig.matrix[this.config.role].channels[event.options.channel].talking

				}
			},

			activateListen: {
				name: 'Toggle listen on a channel',
				options: [
					{
						type: 'dropdown',
						label: "Channel",
						id: "channel",
						choices: this.channelChoices
					}
				],
				callback: async (event) => {
					/**@type {companionEvent} changeObj */
					const changeObj = {
						type: 'broadcast',
						event: this.config.companionIdentity,
						payload: {
							event: 'listenStatusChange',
							channelName: this.intercomConfig.matrix[this.config.role].channels[event.options.channel].channelName,
							channelID: event.options.channel,
							listening: !this.intercomConfig.matrix[this.config.role].channels[event.options.channel].listenActive
						}
					}

					this.intercomConfig.matrix[this.config.role].channels[event.options.channel].listenActive = !this.intercomConfig.matrix[this.config.role].channels[event.options.channel].listenActive
					await this.channel.send(
						changeObj
					)
				}
			},

			setVolume: {
				name: 'Set volume on a channel',
				options: [
					{
						type: 'dropdown',
						label: "Channel",
						id: "channel",
						choices: this.channelChoices
					},
					{
						type: 'number',
						label: "Volume",
						id: "volume",
						default: 100,
						min: 0,
						max: 100,
						step: 1
					}
				],
				callback: async (event) => {
					/**@type {companionEvent} changeObj */
					const changeObj = {
						type: 'broadcast',
						event: this.config.companionIdentity,
						payload: {
							event: 'volumeChange',
							channelName: this.intercomConfig.matrix[this.config.role].channels[event.options.channel].channelName,
							channelID: event.options.channel,
							volume: event.options.volume
						}
					}

					if (event.options.volume > 100) {
						event.options.volume = 100
					} else if (event.options.volume < 0) {
						event.options.volume = 0
					}

					this.intercomConfig.matrix[this.config.role].channels[event.options.channel].volume = event.options.volume
					await this.channel.send(
						changeObj
					)
				}
			},


		})
	}

	updateFeedbacks() {
		this.setFeedbackDefinitions({
			talkActive: {
				type: 'boolean',
				name: 'Talking Status',
				id: 'talkActive',
				defaultStyle: {
					// The default style change for a boolean feedback
					// The user will be able to customise these values as well as the fields that will be changed
					bgcolor: combineRgb(255, 0, 0),
					color: combineRgb(0, 0, 0),
				},
				// options is how the user can choose the condition the feedback activates for
				options: [{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: this.channelChoices
				}],
				callback: (feedback) => {
					console.log("Checking talk feedback", feedback.controlId)
					if (this.status !== undefined) {
						return this.status[feedback.options.channel].talking
					}
				}
			},
			listenActive: {
				type: 'boolean',
				name: 'Listening Status',
				id: 'listenActive',
				defaultStyle: {
					// The default style change for a boolean feedback
					// The user will be able to customise these values as well as the fields that will be changed
					bgcolor: combineRgb(0, 255, 0),
					color: combineRgb(0, 0, 0),
				},
				// options is how the user can choose the condition the feedback activates for
				options: [{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: this.channelChoices
				}],
				callback: (feedback) => {
					console.log("Checking listen feedback", feedback.controlId)
					if (this.status !== undefined) {
						return this.status[feedback.options.channel].listening
					}
				}
			},

			volume: {
				type: 'advanced',
				name: 'Volume',
				id: 'volume',
				defaultStyle: {
					// The default style change for a boolean feedback
					// The user will be able to customise these values as well as the fields that will be changed
					bgcolor: combineRgb(0, 0, 255),
					color: combineRgb(0, 0, 0),
				},
				// options is how the user can choose the condition the feedback activates for
				options: [{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: this.channelChoices
				}],
				callback: (feedback, context) => {
					console.log("Checking volume feedback", feedback.controlId)
					console.log('Context', JSON.stringify(context))
					if (this.status !== undefined) {
						return {text: String(this.status[feedback.options.channel].volume)}
					}
				}
			},
		})
	}
}

runEntrypoint(PanelInstance, UpgradeScripts);