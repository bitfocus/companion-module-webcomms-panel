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

                if (!self.intercomConfig.matrix[self.config.roleId].channels) {
                    return
                }

                const talking = self.intercomConfig.matrix[self.config.roleId].channels[event.options.channel].talkActive

                await self.channel.send(
                    {
                        type: 'broadcast',
                        event: self.config.companionIdentity,
                        payload: {
                            event: 'talkStatusChange',
                            channelId: event.options.channel,
                            talking: !talking
                        }
                    }
                )

                self.intercomConfig.matrix[self.config.roleId].channels[event.options.channel].talkActive = !talking


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

                if (!self.intercomConfig.matrix[self.config.roleId].channels) {
                    return
                }

                await self.channel.send(
                    {
                        type: 'broadcast',
                        event: self.config.companionIdentity,
                        payload: {
                            event: 'listenStatusChange',
                            channelId: event.options.channel,
                            listening: !self.intercomConfig.matrix[self.config.roleId].channels[event.options.channel].listenActive
                        }
                    }
                )

                self.intercomConfig.matrix[self.config.roleId].channels[event.options.channel].listenActive = !self.intercomConfig.matrix[self.config.roleId].channels[event.options.channel].listenActive
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

                if (!self.intercomConfig.matrix[self.config.roleId].channels) {
                    return
                }

                if (event.options.volume > 100) {
                    event.options.volume = 100
                } else if (event.options.volume < 0) {
                    event.options.volume = 0
                }

                await self.channel.send(
                    {
                        type: 'broadcast',
                        event: self.config.companionIdentity,
                        payload: {
                            event: 'volumeChange',
                            channelId: event.options.channel,
                            volume: event.options.volume
                        }
                    }
                )

                self.intercomConfig.matrix[self.config.roleId].channels[event.options.channel].volume = event.options.volume
            }
        }
    })
}