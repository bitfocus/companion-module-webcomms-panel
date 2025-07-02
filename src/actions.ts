import type { ModuleInstance } from './main.js'
import type { Channel, PGM } from './types.d.ts'

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

				const channel = self.state.channels.find((ch) => ch.id === companionOptions.channel)
				if (!channel) return

				const talking = channel.talkActive

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
					channel.talkActive = !talking
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

				const channel = self.state.channels.find((ch) => ch.id === companionOptions.channel)

				if (!channel) return

				const listening = channel.listenActive

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
					channel.listenActive = !listening
				} else if (sentPayload === 'error') {
					self.log('error', 'Failed to send talkStatusChange event')
				} else if (sentPayload === 'timed out') {
					self.log('error', 'Timed out while sending talkStatusChange event')
				}

				self.log('info', JSON.stringify(action))
			},
		},
		setChannelVolume: {
			name: 'Set Channel Volume',
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
				if (!self.state || !self.state.channels || !self.intercomDataChannel || !self.supabaseIntercomConfig) {
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
					intercomEvent: 'channelVolumeChange',
					payload: {
						channelId: companionOptions.channel,
						volume: companionOptions.volume,
					},
				})

				if (sentPayload === 'ok') {
					const templateChannel: Channel | undefined = self.supabaseIntercomConfig.channels.find(
						(ch: Channel) => ch.id === companionOptions.channel,
					)
					if (!templateChannel) {
						self.log('error', 'Invalid channel')
						return
					}

					self.setVariableValues({
						[templateChannel.name.replaceAll(' ', '_') + '_volume']: companionOptions.volume,
					})
				} else if (sentPayload === 'error') {
					self.log('error', 'Failed to send volumeChange event')
				} else if (sentPayload === 'timed out') {
					self.log('error', 'Timed out while sending volumeChange event')
				}

				self.log('info', JSON.stringify(action))
			},
		},

		globalMute: {
			name: 'Globally Mute your Microphone',
			options: [],
			callback: async (action) => {
				if (!self.state || !self.intercomDataChannel) {
					return
				}

				const sentPayload = await self.intercomDataChannel.send({
					type: 'broadcast',
					event: self.config.companionIdentity,
					intercomEvent: 'globalMuteChange',
					payload: {
						channelId: '',
					},
					globals: {
						globalMute: !self.globals.globalMute,
					},
				})

				if (sentPayload === 'error') {
					self.log('error', 'Failed to send globalMuteChange event')
				} else if (sentPayload === 'timed out') {
					self.log('error', 'Timed out while sending globalMuteChange event')
				}

				self.log('info', JSON.stringify(action))
			},
		},

		globalDeafen: {
			name: 'Globally Deafen your Speakers',
			options: [],
			callback: async (action) => {
				if (!self.state || !self.intercomDataChannel) {
					return
				}

				const sentPayload = await self.intercomDataChannel.send({
					type: 'broadcast',
					event: self.config.companionIdentity,
					intercomEvent: 'globalDeafenChange',
					payload: {
						channelId: '',
					},
					globals: {
						globalDeafen: !self.globals.globalDeafen,
					},
				})

				if (sentPayload === 'error') {
					self.log('error', 'Failed to send globalMuteChange event')
				} else if (sentPayload === 'timed out') {
					self.log('error', 'Timed out while sending globalMuteChange event')
				}

				self.log('info', JSON.stringify(action))
			},
		},

		setPGMVolume: {
			name: 'Set PGM Volume',
			options: [
				{
					type: 'dropdown',
					label: 'PGM',
					id: 'pgm',
					choices: self.pgmChoices,
					default: self.pgmChoices.length > 0 ? self.pgmChoices[0].id : '',
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
				if (!self.state || !self.state.pgms || !self.intercomDataChannel || !self.supabaseIntercomConfig) {
					return
				}

				const companionOptions = action.options as {
					pgm: string
					volume: number
				}

				if (companionOptions.volume > 100 || companionOptions.volume < 0) {
					self.log('error', 'Volume must be between 0 and 100')
					return
				}

				const sentPayload = await self.intercomDataChannel.send({
					type: 'broadcast',
					event: self.config.companionIdentity,
					intercomEvent: 'pgmVolumeChange',
					payload: {
						pgmId: companionOptions.pgm,
						volume: companionOptions.volume,
					},
				})

				if (sentPayload === 'ok') {
					const pgm: PGM | undefined = self.supabaseIntercomConfig.pgms.find(
						(pgm: PGM) => pgm.id === companionOptions.pgm,
					)
					if (!pgm) {
						self.log('error', 'Invalid PGM')
						return
					}

					self.setVariableValues({
						[pgm.name.replaceAll(' ', '_') + '_volume']: companionOptions.volume,
					})
				} else if (sentPayload === 'error') {
					self.log('error', 'Failed to send volumeChange event')
				} else if (sentPayload === 'timed out') {
					self.log('error', 'Timed out while sending volumeChange event')
				}

				self.log('info', JSON.stringify(action))
			},
		},
		setPGMHidden: {
			name: 'Set PGM Hidden',
			options: [
				{
					type: 'dropdown',
					label: 'PGM',
					id: 'pgm',
					choices: self.pgmChoices,
					default: self.pgmChoices.length > 0 ? self.pgmChoices[0].id : '',
				},
				{
					type: 'checkbox',
					label: 'Hide PGM Feed',
					id: 'hidden',
					default: false,
				},
			],
			callback: async (action) => {
				if (!self.state || !self.state.pgms || !self.intercomDataChannel || !self.supabaseIntercomConfig) {
					return
				}

				const companionOptions = action.options as {
					pgm: string
					hidden: boolean
				}

				const sentPayload = await self.intercomDataChannel.send({
					type: 'broadcast',
					event: self.config.companionIdentity,
					intercomEvent: 'pgmHiddenChange',
					payload: {
						pgmId: companionOptions.pgm,
						hidden: companionOptions.hidden,
					},
				})

				if (sentPayload === 'ok') {
					const pgm: PGM | undefined = self.supabaseIntercomConfig.pgms.find(
						(pgm: PGM) => pgm.id === companionOptions.pgm,
					)
					if (!pgm) {
						self.log('error', 'Invalid PGM')
						return
					}

					self.setVariableValues({
						[pgm.name.replaceAll(' ', '_') + '_hidden']: companionOptions.hidden,
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
