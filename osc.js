const { InstanceBase, runEntrypoint, combineRgb } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const supabase = require('@supabase/supabase-js')
const dotenv = require('dotenv');

dotenv.config()

class OSCInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.updateStatus('connecting');
		this.supabase = supabase.createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_KEY)
		this.channelChoices = []

		if (this.config.intercomName) {
			this.intercomConfig = await this.supabase.from('intercoms').select('*').eq('name', this.config.intercomName).single()
			if (this.intercomConfig.error) {
				this.updateStatus('bad_config', this.intercomConfig.statusText)
				return
			}


			this.channel = this.supabase.channel(this.config.intercomName)
			this.channelChoices = []
			this.intercomConfig.data.config.channels.map((ch) => { this.channelChoices.push({ id: ch, label: ch }) })
		}

		this.updateStatus('ok')

		this.updateActions() // export actions
		this.updateFeedbacks()
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.channelChoices = []
		this.config = config

		this.updateStatus('connecting');

		if (this.config.intercomName) {
			this.intercomConfig = await this.supabase.from('intercoms').select('*').eq('name', this.config.intercomName).single()
			if (this.intercomConfig.error) {
				this.updateStatus('bad_config', this.intercomConfig.statusText)
				return
			}


			this.channel = this.supabase.channel(this.config.intercomName)
			this.messages = {}
			this.channel.on('broadcast', { event: this.config.userID }, (msg) => {
				this.messages = msg
				this.log('info', JSON.stringify(msg))
			}).subscribe()

			this.intercomConfig.data.config.channels.map((ch) => { this.channelChoices.push({ id: ch, label: ch }) })
		}

		this.updateStatus('ok')

		this.updateActions()
		this.updateFeedbacks()

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
				id: 'userID',
				label: 'User ID',
				width: 12,
				default: ''
			},
		]
	}

	updateActions() {
		this.setActionDefinitions({
			activateTalk: {
				name: 'Activate talk on a channel',
				options: [
					{
						type: 'dropdown',
						label: "Channel",
						id: "channel",
						choices: this.channelChoices
					}
				],
				callback: async (event) => {
					const changeObj = {}
					changeObj[event.options.channel] = { talking: true }
					await this.channel.send({
						type: 'broadcast',
						event: this.config.userID,
						payload: { ...changeObj }
					})
					setTimeout(() => { this.checkFeedbacks('talkActive') }, 100)
				}
			},
			deactivateTalk: {
				name: 'Deactivate talk on a channel',
				options: [
					{
						type: 'dropdown',
						label: "Channel",
						id: "channel",
						choices: this.channelChoices
					}
				],
				callback: async (event) => {
					const changeObj = {}
					changeObj[event.options.channel] = { talking: false }
					await this.channel.send({
						type: 'broadcast',
						event: this.config.userID,
						payload: { ...changeObj }
					})
					setTimeout(() => { this.checkFeedbacks('talkActive') }, 100)
				}
			},

		})
	}

	updateFeedbacks() {
		this.setFeedbackDefinitions({
			talkActive: {
				type: 'boolean',
				name: 'talkActive',
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
					this.log('debug', JSON.stringify({"Notice": "feedback", feedback: feedback, messages: this.messages }))
					if (this.messages?.payload[feedback.options.channel] !== undefined) {
						return this.messages.payload[feedback.options.channel].talking
					} else {
						return false
					}
				}
			}
		})
	}
}

runEntrypoint(OSCInstance, UpgradeScripts);