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
            options: [{
                type: 'dropdown',
                label: 'Channel',
                id: 'channel',
                choices: self.channelChoices
            }],
            callback: (feedback) => {
                console.log("Checking talk feedback", feedback.controlId)
                if (self.status !== undefined) {
                    return self.status[feedback.options.channel].talking
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
                choices: self.channelChoices
            }],
            callback: (feedback) => {
                console.log("Checking listen feedback", feedback.controlId)
                if (self.status !== undefined) {
                    return self.status[feedback.options.channel].listening
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
                choices: self.channelChoices
            }],
            callback: (feedback, context) => {
                console.log("Checking volume feedback", feedback.controlId)
                console.log('Context', JSON.stringify(context))
                if (self.status !== undefined) {
                    return { text: String(self.status[feedback.options.channel].volume) }
                }
            }
        },
    })
}