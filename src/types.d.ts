import type { RealtimeMessage } from '@supabase/supabase-js'

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
	talkStatusChange: RoleChannel
	channelActivityStatusChange: RoleChannel
	listenStatusChange: RoleChannel
	channelVolumeChange: RoleChannel
	pgmVolumeChange: RolePGM
	pgmHiddenChange: RolePGM
	companionSyncResponse: Role
	companionSyncRequest?: undefined
}

export type IntercomDataChannelBroadcast<T extends keyof PayloadMap = keyof PayloadMap> = {
	type: 'broadcast'
	event: RealtimeMessage['event']
	intercomEvent: T
} & {
	payload: T extends 'companionSyncRequest' ? PayloadMap[T] | undefined : PayloadMap[T]
}

export type IntercomConfigWithRelations = QueryData<
	Database['public']['Tables']['intercoms']['Row'] & {
		channels: Database['public']['Tables']['channels']['Row'][]
		pgms: Database['public']['Tables']['pgms']['Row'][]
		roles: Database['public']['Tables']['roles']['Row'][]
	}
>

export type CompanionEventResponsePayload = {
	event: string
	state: Channel
	roleId?: string
}

export type CompanionEventRequestPayload = {
	event: string
	channelId: string
	talking?: boolean
	listening?: boolean
	volume?: number
	roleId?: string
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
	talkActivity: boolean
	volume: number
	listenActive: boolean
	talkActive: boolean
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
