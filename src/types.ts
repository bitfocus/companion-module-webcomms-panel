export type SyncResponse = {
	panel: {
		inputMuted: boolean | undefined
		outputMuted: boolean | undefined
	}
	channels: {
		id: string
		name: string
		permission: ChannelPermission
		inputMuted: boolean
		outputMuted: boolean
		isTalking: boolean
		activity: boolean
		volume: number
	}[]
	created_at: string
	id: string
	name: string
	password: string | null
	workspace: string
	companion: null | 'basic' | 'advanced'
}

export type ChannelSyncData = {
	id: string
	name: string
	permission: ChannelPermission
	inputMuted: boolean
	outputMuted: boolean
	isTalking: boolean
	activity: boolean
	volume: number
}

export type ChannelPermission = 'disabled' | 'listenOnly' | 'talkOnly' | 'duplex'

export type ChannelAction = 'muteInput' | 'unmuteInput' | 'muteOutput' | 'unmuteOutput' | 'setVolume'

export type PanelAction = 'muteInput' | 'unmuteInput' | 'muteOutput' | 'unmuteOutput'
