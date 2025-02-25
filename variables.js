module.exports = function (self) {
    if (!self.config.roleId) {
        self.setVariableDefinitions([])
    }

    const role = self.intercomConfig.matrix[self.config.roleId]

    if (!role || !self.intercomConfig || !role.channels) {
        self.setVariableDefinitions([])
        return
    }

    self.setVariableDefinitions(
        Object.values(role.channels).map((channel, index) => {
            return {
                variableId: channel.templateChannel.channelName.replaceAll(' ', '_'),
                name: channel.templateChannel.channelName,
                variableType: 'number'
            }
        })
    )

    let variableValues = {}

    Object.values(role.channels).forEach((channel, index) => {
        variableValues[channel.templateChannel.channelName.replaceAll(' ', '_')] = channel.volume

    })




    self.setVariableValues(variableValues)
}
