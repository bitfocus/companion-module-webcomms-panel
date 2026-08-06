import { combineRgb } from '@companion-module/base'
import type ModuleInstance from './main.js'

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		talkStatus: {
			name: 'Channel Talk Status',
			type: 'boolean',
			defaultStyle: {
				// The default style change for a boolean feedback
				// The user will be able to customise these values as well as the fields that will be changed
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			// options is how the user can choose the condition the feedback activates for
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: self.state?.channels.map((ch) => ({ id: ch.id, label: ch.name })) ?? [],
					default: self.state?.channels && self.state?.channels.length > 0 ? self.state.channels[0].id : '',
				},
			],
			callback: (feedback) => {
				const feedbackOptions = feedback.options as {
					channel: string
				}

				if (!self.state) return false

				const channel = self.state.channels.find((ch) => ch.id === feedbackOptions.channel)
				if (!channel) return false

				self.log('debug', 'Updating talking feedback')
				return channel.isTalking
			},
		},
		listenStatus: {
			type: 'boolean',
			name: 'Channel Listening Status',
			defaultStyle: {
				// The default style change for a boolean feedback
				// The user will be able to customise these values as well as the fields that will be changed
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			// options is how the user can choose the condition the feedback activates for
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: self.state?.channels.map((ch) => ({ id: ch.id, label: ch.name })) ?? [],
					default: self.state?.channels && self.state?.channels.length > 0 ? self.state.channels[0].id : '',
				},
			],
			callback: (feedback) => {
				const feedbackOptions = feedback.options as {
					channel: string
				}

				if (!self.state) return false

				const channel = self.state.channels.find((ch) => ch.id === feedbackOptions.channel)

				if (!channel) return false

				self.log('debug', 'Updating listen feedback')
				return !(channel.outputMuted || channel.volume === 0)
			},
		},

		globalMute: {
			type: 'boolean',
			name: 'Global Panel Mute Status',
			defaultStyle: {
				// The default style change for a boolean feedback
				// The user will be able to customise these values as well as the fields that will be changed
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [],

			callback: () => {
				return self.state?.panel.inputMuted ?? false
			},
		},

		globalDeafen: {
			type: 'boolean',
			name: 'Global Panel Deafen Status',
			defaultStyle: {
				// The default style change for a boolean feedback
				// The user will be able to customise these values as well as the fields that will be changed
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [],

			callback: () => {
				return self.state?.panel.outputMuted ?? false
			},
		},

		channelActivity: {
			name: 'Channel Activity',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 200, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					choices: self.state?.channels.map((ch) => ({ id: ch.id, label: ch.name })) ?? [],
					default: self.state?.channels && self.state?.channels.length > 0 ? self.state.channels[0].id : '',
				},
			],
			callback: (feedback) => {
				const feedbackOptions = feedback.options as {
					channel: string
				}

				if (!self.state) return false

				const channel = self.state.channels.find((ch) => ch.id === feedbackOptions.channel)

				if (!channel) return false

				self.log('debug', 'Updating channel activity')
				return channel.activity
			},
		},
	})
}
