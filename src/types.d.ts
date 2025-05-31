import type { RealtimeMessage } from '@supabase/supabase-js'

export interface SupabaseEnvVars {
	PUBLIC_SUPABASE_URL: string
	PUBLIC_SUPABASE_KEY: string
}

export interface ChannelChoice {
	id: string
	label: string
}

export interface RoleChoice {
	id: string
	label: string
}

export interface TemplateChannel {
	channelId: string
	channelName: string
}

export interface Channel {
	templateChannel: TemplateChannel
	localPermissions: 'disabled' | 'listenOnly' | 'talkOnly' | 'duplex'
	talkActivity: boolean
	volume: number
	listenActive: boolean
	talkActive: boolean
}

interface PayloadMap {
	talkStatusChange: Channel
	channelActivityStatusChange: Channel
	listenStatusChange: Channel
	volumeChange: Channel
	companionSyncResponse: Role
	companionSyncRequest?: undefined
}

export interface Role {
	id: string
	name: string
	orderIndex: number
	channels: Record<string, Channel>
	pgmFeeds: Record<string, PgmFeed>
}

export type IntercomDataChannelBroadcast<T extends keyof PayloadMap = keyof PayloadMap> = {
	type: 'broadcast'
	event: RealtimeMessage['event']
	intercomEvent: T
} & {
	payload: T extends 'companionSyncRequest' ? PayloadMap[T] | undefined : PayloadMap[T]
}
