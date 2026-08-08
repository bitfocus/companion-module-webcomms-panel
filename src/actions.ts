import type ModuleInstance from './main.js'
import type { ChannelAction, PanelAction, SyncResponse } from './types.js'

function getChannelChoices(state?: SyncResponse) {
	if (!state) return []

	return state.channels.map(({ id, name: label }) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))
}

function validStateAndChannels(
	self: ModuleInstance,
	validateChannels: boolean = true,
): self is ModuleInstance & { state: SyncResponse } {
	if (!self.state) {
		self.log('warn', 'No state for panel, connection or sync required')
		return false
	} else if (validateChannels && !self.state.channels) {
		self.log('warn', 'No channels in state for panel, needs new connection or sync')
		return false
	}

	return true
}

export function UpdateActions(self: ModuleInstance): void {
	const channelChoices = getChannelChoices(self.state)

	self.setActionDefinitions({
		unmuteChannelInput: {
			name: 'Channel: Activate Talk',
			description: 'Activate talking on a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: channelChoices,
					default: channelChoices[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!validStateAndChannels(self)) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'unmuteInput')
				channel.isTalking = true
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
					choices: channelChoices,
					default: channelChoices[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!validStateAndChannels(self)) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'muteInput')
				channel.isTalking = false
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
					choices: channelChoices,
					default: channelChoices[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!validStateAndChannels(self)) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, channel.isTalking ? 'muteInput' : 'unmuteInput')
				channel.isTalking = !channel.isTalking
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
					choices: channelChoices,
					default: channelChoices[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!validStateAndChannels(self)) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'muteOutput')
				channel.outputMuted = true
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
					choices: channelChoices,
					default: channelChoices[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!validStateAndChannels(self)) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, 'unmuteOutput')
				channel.outputMuted = false
			},
		},

		// A user can toggle the hard output mute of a channel regardless of the volume.
		// If the user has set the volume at 0 and toggles the output mute then the result can only be
		// removing the mute and setting the volume to what it was before the mute, which is handled in Web Comms.
		toggleChannelOutput: {
			name: 'Channel: Toggle Output Mute',
			description: 'Toggle the output mute of a channel',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: channelChoices,
					default: channelChoices[0]?.id ?? '',
				},
			],
			callback: (action) => {
				if (!validStateAndChannels(self)) {
					return
				}

				const { channel: channelId } = action.options as {
					channel: string
				}

				const channel = self.state.channels.find((ch) => ch.id === channelId)
				if (!channel) return

				emitChannelAction(self, channelId, !channel.outputMuted ? 'muteOutput' : 'unmuteOutput')
				channel.outputMuted = !channel.outputMuted
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
					choices: channelChoices,
					default: channelChoices[0]?.id ?? '',
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
				if (!validStateAndChannels(self)) {
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
			},
		},

		mutePanelInput: {
			name: 'Panel: Mute Mic',
			description: 'Globally mute your microphone',
			options: [],
			callback: () => {
				if (!validStateAndChannels(self, false)) {
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
				if (!validStateAndChannels(self, false)) {
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
				if (!validStateAndChannels(self, false)) {
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
			callback: () => {
				if (!validStateAndChannels(self, false)) {
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
			callback: () => {
				if (!validStateAndChannels(self, false)) {
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
			callback: () => {
				if (!validStateAndChannels(self, false)) {
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
