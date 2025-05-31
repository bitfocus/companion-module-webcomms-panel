import type { ModuleInstance } from './main.js'
import type { TemplateChannel } from './types.d.ts'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		toggleTalk: {
			name: 'Toggle Talk',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: self.channelChoices,
					default: self.channelChoices.length > 0 ? self.channelChoices[0].id : '',
				},
			],
			callback: async (action) => {
				if (!self.state || !self.state.channels || !self.intercomDataChannel) {
					return
				}

				const companionOptions = action.options as {
					channel: string
				}

				const talking = self.state.channels[companionOptions.channel].talkActive

				const sentPayload = await self.intercomDataChannel.send({
					type: 'broadcast',
					event: self.config.companionIdentity,
					intercomEvent: 'talkStatusChange',
					payload: {
						channelId: companionOptions.channel,
						talking: !talking,
					},
				})

				if (sentPayload === 'ok') {
					self.state.channels[companionOptions.channel].talkActive = !talking
				} else if (sentPayload === 'error') {
					self.log('error', 'Failed to send talkStatusChange event')
				} else if (sentPayload === 'timed out') {
					self.log('error', 'Timed out while sending talkStatusChange event')
				}

				self.log('info', JSON.stringify(action))
			},
		},

		toggleListen: {
			name: 'Toggle Listen',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: self.channelChoices,
					default: self.channelChoices.length > 0 ? self.channelChoices[0].id : '',
				},
			],
			callback: async (action) => {
				if (!self.state || !self.state.channels || !self.intercomDataChannel) {
					return
				}

				const companionOptions = action.options as {
					channel: string
				}

				const listening = self.state.channels[companionOptions.channel].listenActive

				const sentPayload = await self.intercomDataChannel.send({
					type: 'broadcast',
					event: self.config.companionIdentity,
					intercomEvent: 'listenStatusChange',
					payload: {
						channelId: companionOptions.channel,
						listening: !listening,
					},
				})

				if (sentPayload === 'ok') {
					self.state.channels[companionOptions.channel].listenActive = !listening
				} else if (sentPayload === 'error') {
					self.log('error', 'Failed to send talkStatusChange event')
				} else if (sentPayload === 'timed out') {
					self.log('error', 'Timed out while sending talkStatusChange event')
				}

				self.log('info', JSON.stringify(action))
			},
		},
		setVolume: {
			name: 'Set Volume',
			options: [
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					choices: self.channelChoices,
					default: self.channelChoices.length > 0 ? self.channelChoices[0].id : '',
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
			callback: async (action) => {
				if (
					!self.state ||
					!self.state.channels ||
					!self.intercomDataChannel ||
					!self.supabaseIntercomConfig ||
					!self.supabaseIntercomConfig.templateChannels
				) {
					return
				}

				const companionOptions = action.options as {
					channel: string
					volume: number
				}

				if (companionOptions.volume > 100 || companionOptions.volume < 0) {
					self.log('error', 'Volume must be between 0 and 100')
					return
				}

				const sentPayload = await self.intercomDataChannel.send({
					type: 'broadcast',
					event: self.config.companionIdentity,
					intercomEvent: 'volumeChange',
					payload: {
						channelId: companionOptions.channel,
						volume: companionOptions.volume,
					},
				})

				if (sentPayload === 'ok') {
					const templateChannel: TemplateChannel | undefined = Object.values(
						self.supabaseIntercomConfig.templateChannels,
					).find((ch: TemplateChannel) => ch.channelId === companionOptions.channel)
					if (!templateChannel) {
						self.log('error', 'Invalid channel')
						return
					}

					self.setVariableValues({
						[templateChannel.channelName.replaceAll(' ', '_') + '_volume']: companionOptions.volume,
					})
				} else if (sentPayload === 'error') {
					self.log('error', 'Failed to send volumeChange event')
				} else if (sentPayload === 'timed out') {
					self.log('error', 'Timed out while sending volumeChange event')
				}

				self.log('info', JSON.stringify(action))
			},
		},
	})
}
