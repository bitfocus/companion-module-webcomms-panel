module.exports = function (self) {
	if (Object.keys(self.state).length === 0) {
        self.setVariableDefinitions([])
	} else {
        self.setVariableDefinitions(
            Object.keys(self.state).map((key, index) => {
                return {
                    variableId: 'volume' + index,
                    name: self.state[key].channelName + " Volume",
                    variableType: 'number'
                }
            })
        )

        const values = {}

        Object.keys(self.state).forEach((key, index) => {
            values['volume' + index] = self.state[key].volume
        })

        self.setVariableValues(values)
    }
}
