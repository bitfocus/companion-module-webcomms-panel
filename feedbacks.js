const { combineRgb } = require('@companion-module/base')

module.exports = function (self) {
	self.setFeedbackDefinitions({
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
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: self.channelChoices,
				},
			],
			callback: (feedback) => {
				self.log('info', 'Checking talk feedback')
				if (
					self.state === undefined ||
					self.state[feedback.options.channel] === undefined ||
					self.state[feedback.options.channel].talking === undefined
				) {
					self.log('warn', 'Talking state is undefined')
					return false
				}

                self.log('info', "Updating talking feedback")
				return self.state[feedback.options.channel].talking
			},
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
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: self.channelChoices,
				},
			],
			callback: (feedback) => {
				self.log('info', 'Checking listen feedback')
				if (
					self.state === undefined ||
					self.state[feedback.options.channel] === undefined ||
					self.state[feedback.options.channel].listening === undefined
				) {
					self.log('warn', 'Listen state is undefined')
					return false
				}

				self.log('info', 'Updating listen feedback')
				return self.state[feedback.options.channel].listening
			},
		},


	})
}
