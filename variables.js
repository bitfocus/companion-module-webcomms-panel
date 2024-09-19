module.exports = function (self) {

    const vars = self.intercom.channels.forEach((channel, index) => {
        return self.intercomConfig.matrix[self.config.role].channels[index]
    })


    self.setVariableDefinitions([

    ])
}