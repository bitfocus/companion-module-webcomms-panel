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
				self.log('info', 'Checking talk feedback')
				if (
					self.state === undefined ||
					self.state.channels === undefined ||
					self.state.channels[feedbackOptions.channel] === undefined ||
					self.state.channels[feedbackOptions.channel].talkActive === undefined
				) {
					self.log('warn', 'Talking state is undefined')
					return false
				}

				self.log('info', 'Updating talking feedback')
				return self.state.channels[feedbackOptions.channel].talkActive
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

				self.log('info', 'Checking listen feedback')
				if (
					self.state === undefined ||
					self.state.channels === undefined ||
					self.state.channels[feedbackOptions.channel] === undefined ||
					self.state.channels[feedbackOptions.channel].listenActive === undefined
				) {
					self.log('warn', 'Listen state is undefined')
					return false
				}

				self.log('info', 'Updating listen feedback')
				return self.state.channels[feedbackOptions.channel].listenActive
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

				self.log('info', 'Checking channel activity')
				if (
					self.state === undefined ||
					self.state.channels === undefined ||
					self.state.channels[feedbackOptions.channel] === undefined ||
					self.state.channels[feedbackOptions.channel].talkActivity === undefined
				) {
					self.log('warn', 'Channel activity is undefined')
					return false
				}

				self.log('info', 'Updating channel activity')
				return self.state.channels[feedbackOptions.channel].talkActivity
			},
		},
	})
}
