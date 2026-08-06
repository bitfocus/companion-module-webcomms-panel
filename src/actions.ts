import type ModuleInstance from './main.js'
import type { ChannelAction, PanelAction, SyncResponse } from './types.d.js'

function getChannelChoices(state?: SyncResponse) {
	if (!state) return []

	return state.channels.map(({ id, name: label }) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		unmuteChannelInput: {
			name: 'Channel: Activate Talk',
			description: 'Activate talking on a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: getChannelChoices(self.state),
					default: getChannelChoices(self.state)[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!self.state || !self.state.channels) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'unmuteInput')
				channel.isTalking = true

				self.log('info', JSON.stringify(action))
			},
		},

		muteChannelInput: {
			name: 'Channel: Deactivate Talk',
			description: 'Deactivate talking on a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: getChannelChoices(self.state),
					default: getChannelChoices(self.state)[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!self.state || !self.state.channels) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'muteInput')
				channel.isTalking = false

				self.log('info', JSON.stringify(action))
			},
		},

		toggleChannelInput: {
			name: 'Channel: Toggle Talk Activation',
			description: 'Toggle talking into a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: getChannelChoices(self.state),
					default: getChannelChoices(self.state)[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!self.state || !self.state.channels) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, channel.isTalking ? 'muteInput' : 'unmuteInput')
				channel.isTalking = !channel.isTalking

				self.log('info', JSON.stringify(action))
			},
		},

		muteChannelOutput: {
			name: 'Channel: Mute Output',
			description: 'Mute the sound output by a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: getChannelChoices(self.state),
					default: getChannelChoices(self.state)[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!self.state || !self.state.channels) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'muteOutput')
				channel.outputMuted = true

				self.log('info', JSON.stringify(action))
			},
		},

		unmuteChannelOutput: {
			name: 'Channel: Unmute Output',
			description: 'Unmute the sound output by a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: getChannelChoices(self.state),
					default: getChannelChoices(self.state)[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!self.state || !self.state.channels) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'unmuteOutput')
				channel.outputMuted = false

				self.log('info', JSON.stringify(action))
			},
		},

		toggleChannelOutput: {
			name: 'Channel: Toggle Output Mute',
			description: 'Toggle the output mute of a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: getChannelChoices(self.state),
					default: getChannelChoices(self.state)[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!self.state || !self.state.channels) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, !channel.outputMuted ? 'muteOutput' : 'unmuteOutput')
				channel.outputMuted = !channel.outputMuted

				self.log('info', JSON.stringify(action))
			},
		},

		setChannelVolume: {
			name: 'Channel: Set Output Volume',
			description: 'Set the output volume of a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: getChannelChoices(self.state),
					default: getChannelChoices(self.state)[0]?.id ?? '',
				},
				{
					type: 'number',
					label: 'Volume',
					id: 'volume',
					default: 100,
					min: 0,
					max: 100,
					step: 1,
				},
			],
			callback: (action) => {
				if (!self.state || !self.state.channels) {
					return
				}

				const { channel: channelId, volume } = action.options as {
					channel: string
					volume: number
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'setVolume', volume)
				channel.volume = volume

				self.log('info', JSON.stringify(action))
			},
		},

		mutePanelInput: {
			name: 'Panel: Mute Mic',
			description: 'Globally mute your microphone',
			options: [],
			callback: () => {
				if (!self.state) {
					return
				}

				emitPanelAction(self, 'muteInput')
				self.state.panel.inputMuted = true
			},
		},

		unmutePanelInput: {
			name: 'Panel: Unmute Mic',
			description: 'Globally unmute your microphone',
			options: [],
			callback: () => {
				if (!self.state) {
					return
				}

				emitPanelAction(self, 'unmuteInput')
				self.state.panel.inputMuted = false
			},
		},

		togglePanelInput: {
			name: 'Panel: Toggle Mic Mute',
			description: 'Globally toggle your microphone on/off',
			options: [],
			callback: () => {
				if (!self.state) {
					return
				}

				emitPanelAction(self, self.state.panel.inputMuted ? 'unmuteInput' : 'muteInput')
				self.state.panel.inputMuted = !self.state.panel.inputMuted
			},
		},

		mutePanelOutput: {
			name: 'Panel: Mute Output',
			description: 'Globally mute the output of the intercom',
			options: [],
			callback: async () => {
				if (!self.state) {
					return
				}

				emitPanelAction(self, 'muteOutput')
				self.state.panel.outputMuted = true
			},
		},

		unmutePanelOutput: {
			name: 'Panel: Unmute Output',
			description: 'Globally unmute the output of the intercom',
			options: [],
			callback: async () => {
				if (!self.state) {
					return
				}

				emitPanelAction(self, 'unmuteOutput')
				self.state.panel.outputMuted = false
			},
		},

		togglePanelOutput: {
			name: 'Panel: Toggle Panel Output',
			description: 'Toggle the output mute of the intercom',
			options: [],
			callback: async () => {
				if (!self.state) {
					return
				}

				emitPanelAction(self, self.state.panel.outputMuted ? 'unmuteOutput' : 'muteOutput')
				self.state.panel.outputMuted = !self.state.panel.outputMuted
			},
		},
	})

	self.log('info', 'actions updated')
}

function emitChannelAction(self: ModuleInstance, channelId: string, action: ChannelAction, volume?: number) {
	if (!self.socket) return
	self.socket.emit('channelEvent', channelId, action, volume)
}

function emitPanelAction(self: ModuleInstance, action: PanelAction) {
	if (!self.socket) return

	self.socket.emit('panelEvent', action)
}
