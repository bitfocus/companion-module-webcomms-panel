module.exports = function (self) {
    self.setActionDefinitions({
        activateTalk: {
            name: 'Toggle talk on a channel',
            options: [
                {
                    type: 'dropdown',
                    label: "Channel",
                    id: "channel",
                    choices: self.channelChoices
                }
            ],
            callback: async (event) => {

                if (!self.intercomConfig.matrix[self.config.roleID].channels) {
                    return
                }

                /**@type {companionEvent} changeObj */
                const changeObj = {
                    type: 'broadcast',
                    event: self.config.companionIdentity,
                    payload: {
                        event: 'talkStatusChange',
                        channelName: self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].channelName,
                        channelID: event.options.channel,
                        talking: !self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].talking
                    }
                }

                await self.channel.send(
                    changeObj
                )

                self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].talking = !self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].talking

            }
        },

        activateListen: {
            name: 'Toggle listen on a channel',
            options: [
                {
                    type: 'dropdown',
                    label: "Channel",
                    id: "channel",
                    choices: self.channelChoices
                }
            ],
            callback: async (event) => {

                if (!self.intercomConfig.matrix[self.config.roleID].channels) {
                    return
                }

                /**@type {companionEvent} changeObj */
                const changeObj = {
                    type: 'broadcast',
                    event: self.config.companionIdentity,
                    payload: {
                        event: 'listenStatusChange',
                        channelName: self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].channelName,
                        channelID: event.options.channel,
                        listening: !self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].listenActive
                    }
                }

                self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].listenActive = !self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].listenActive
                await self.channel.send(
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
                    choices: self.channelChoices
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

                if (!self.intercomConfig.matrix[self.config.roleID].channels) {
                    return
                }
                
                /**@type {companionEvent} changeObj */
                const changeObj = {
                    type: 'broadcast',
                    event: self.config.companionIdentity,
                    payload: {
                        event: 'volumeChange',
                        channelName: self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].channelName,
                        channelID: event.options.channel,
                        volume: event.options.volume
                    }
                }

                if (event.options.volume > 100) {
                    event.options.volume = 100
                } else if (event.options.volume < 0) {
                    event.options.volume = 0
                }

                self.intercomConfig.matrix[self.config.roleID].channels[event.options.channel].volume = event.options.volume
                await self.channel.send(
                    changeObj
                )
            }
        }
    })
}