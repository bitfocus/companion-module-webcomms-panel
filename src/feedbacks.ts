import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

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
					choices: self.channelChoices,
					default: self.channelChoices.length > 0 ? self.channelChoices[0].id : '',
				},
			],
			callback: (feedback) => {
				const feedbackOptions = feedback.options as {
					channel: string
				}

				if (!self.state) return false

				const channel = self.state.channels.find((ch) => ch.id === feedbackOptions.channel)
				if (!channel) return false

				self.log('info', 'Updating talking feedback')
				return channel.talkActive
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
					choices: self.channelChoices,
					default: self.channelChoices.length > 0 ? self.channelChoices[0].id : '',
				},
			],
			callback: (feedback) => {
				const feedbackOptions = feedback.options as {
					channel: string
				}

				if (!self.state) return false

				const channel = self.state.channels.find((ch) => ch.id === feedbackOptions.channel)

				if (!channel) return false

				self.log('info', 'Updating listen feedback')
				return channel.listenActive
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
					choices: self.channelChoices,
					default: self.channelChoices.length > 0 ? self.channelChoices[0].id : '',
				},
			],
			callback: (feedback) => {
				const feedbackOptions = feedback.options as {
					channel: string
				}

				if (!self.state) return false

				const channel = self.state.channels.find((ch) => ch.id === feedbackOptions.channel)

				if (!channel) return false

				self.log('info', 'Updating channel activity')
				return channel.talkActivity
			},
		},
		pgmHidden: {
			name: 'PGM Hidden',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(71, 85, 105),
				color: combineRgb(203, 213, 225),
			},
			options: [
				{
					id: 'pgm',
					type: 'dropdown',
					label: 'PGM',
					choices: self.pgmChoices,
					default: self.pgmChoices.length > 0 ? self.pgmChoices[0].id : '',
				},
			],
			callback: (feedback) => {
				const feedbackOptions = feedback.options as {
					pgm: string
				}

				if (!self.state) return false

				const pgm = self.state.pgms.find((pgm) => pgm.id === feedbackOptions.pgm)

				if (!pgm) return false
				self.log('info', 'Updating PGM Hidden State')
				return pgm.hidden
			},
		},
	})
}
