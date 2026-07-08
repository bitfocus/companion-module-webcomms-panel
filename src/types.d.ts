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

type ChannelSyncData = {
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

export interface SupabaseEnvVars {
	PUBLIC_SUPABASE_URL: string
	PUBLIC_SUPABASE_KEY: string
}

export interface ChannelChoice {
	id: string
	label: string
}

export interface PGMChoice {
	id: string
	label: string
}

export interface RoleChoice {
	id: string
	label: string
}

interface PayloadMap {
	companionSyncResponse: Role
	companionSyncRequest?: undefined
}

export type IntercomDataChannelBroadcast<T extends keyof PayloadMap = keyof PayloadMap> =
	T extends 'companionSyncRequest'
		? {
				type: 'broadcast'
				event: RealtimeMessage['event']
				intercomEvent: T
				payload: undefined
			}
		: {
				type: 'broadcast'
				event: RealtimeMessage['event']
				intercomEvent: T
				payload: PayloadMap[T]
				globals: Globals
			}

export type IntercomConfigWithRelations = QueryData<
	Database['public']['Tables']['intercoms']['Row'] & {
		channels: Database['public']['Tables']['channels']['Row'][]
		pgms: Database['public']['Tables']['pgms']['Row'][]
		roles: Database['public']['Tables']['roles']['Row'][]
	}
>

interface Globals {
	globalMute: boolean
	globalDeafen: boolean
}

export type CompanionEventResponsePayload = {
	event: string
	state: Role | RoleChannel | RolePGM | Globals
	roleId?: string
}

export type CompanionEventRequestPayload = {
	event: string
	channelId: string
	talking?: boolean
	listening?: boolean
	volume?: number
	roleId?: string
	globals: Globals
}

export type DatabaseChannel = {
	id: string
	name: string
	orderIndex: number
	intercom?: number
	sendTrackId?: string
	remoteIntercomParticipants?: Record<string, RemoteIntercomParticipant>
}

export interface Channel extends DatabaseChannel {
	sendTrackId?: string
	remoteIntercomParticipants: Record<string, RemoteIntercomParticipant>
}

export type RoleChannel = {
	id: string
	localPermissions: 'disabled' | 'listenOnly' | 'talkOnly' | 'duplex'
	channelActivity: boolean
	volume: number
	listening: boolean
	talking: boolean
}

export type DatabasePGM = {
	id: string
	name: string
	orderIndex: number
	intercom?: number
	enableTranscoding: boolean
	ingress: IngressInfo | object
}

export interface PGM extends DatabasePGM {
	trackIDs: Array<string>
}

export type RolePGM = {
	id: string
	localPermissions: 'active' | 'disabled'
	hidden: boolean
	volume: number
}

export type RemoteIntercomParticipant = {
	userId: string
	userName: string
	talking: boolean
	listening: boolean
	volume: number
	trackId?: string
	remotePermissions: 'disabled' | 'listenOnly' | 'talkOnly' | 'duplex'
}

export type Role = {
	id: string
	name: string
	orderIndex: number
	intercom?: number
	channels: RoleChannel[]
	pgms: RolePGM[]
}
