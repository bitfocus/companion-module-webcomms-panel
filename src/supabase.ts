export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			graphql: {
				Args: {
					operationName?: string
					query?: string
					variables?: Json
					extensions?: Json
				}
				Returns: Json
			}
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
	public: {
		Tables: {
			channels: {
				Row: {
					id: string
					intercom: number
					name: string | null
					orderIndex: number | null
					user: string | null
				}
				Insert: {
					id?: string
					intercom: number
					name?: string | null
					orderIndex?: number | null
					user?: string | null
				}
				Update: {
					id?: string
					intercom?: number
					name?: string | null
					orderIndex?: number | null
					user?: string | null
				}
				Relationships: [
					{
						foreignKeyName: 'channels_intercom_fkey'
						columns: ['intercom']
						isOneToOne: false
						referencedRelation: 'intercoms'
						referencedColumns: ['id']
					},
					{
						foreignKeyName: 'channels_user_fkey'
						columns: ['user']
						isOneToOne: false
						referencedRelation: 'users'
						referencedColumns: ['id']
					},
				]
			}
			feedback: {
				Row: {
					activeToggles: Json | null
					created_at: string
					email: string | null
					feedback: string | null
					id: string
					user: string | null
				}
				Insert: {
					activeToggles?: Json | null
					created_at?: string
					email?: string | null
					feedback?: string | null
					id?: string
					user?: string | null
				}
				Update: {
					activeToggles?: Json | null
					created_at?: string
					email?: string | null
					feedback?: string | null
					id?: string
					user?: string | null
				}
				Relationships: [
					{
						foreignKeyName: 'feedback_user_fkey'
						columns: ['user']
						isOneToOne: false
						referencedRelation: 'users'
						referencedColumns: ['id']
					},
				]
			}
			intercoms: {
				Row: {
					created_at: string
					id: number
					name: string
					password: string | null
					user: string | null
				}
				Insert: {
					created_at?: string
					id?: number
					name: string
					password?: string | null
					user?: string | null
				}
				Update: {
					created_at?: string
					id?: number
					name?: string
					password?: string | null
					user?: string | null
				}
				Relationships: [
					{
						foreignKeyName: 'intercoms_user_fkey'
						columns: ['user']
						isOneToOne: false
						referencedRelation: 'users'
						referencedColumns: ['id']
					},
				]
			}
			intercomsv2: {
				Row: {
					created_at: string
					id: number
					matrix: Json | null
					name: string
					password: string | null
					templateChannels: Json | null
					user: string | null
				}
				Insert: {
					created_at?: string
					id?: number
					matrix?: Json | null
					name: string
					password?: string | null
					templateChannels?: Json | null
					user?: string | null
				}
				Update: {
					created_at?: string
					id?: number
					matrix?: Json | null
					name?: string
					password?: string | null
					templateChannels?: Json | null
					user?: string | null
				}
				Relationships: [
					{
						foreignKeyName: 'intercomsv2_user_fkey'
						columns: ['user']
						isOneToOne: false
						referencedRelation: 'users'
						referencedColumns: ['id']
					},
				]
			}
			notices: {
				Row: {
					active: boolean | null
					created_at: string
					href: string | null
					href_label: string | null
					id: number
					message: string | null
					name: string | null
					tailwind_colour: string | null
				}
				Insert: {
					active?: boolean | null
					created_at?: string
					href?: string | null
					href_label?: string | null
					id?: number
					message?: string | null
					name?: string | null
					tailwind_colour?: string | null
				}
				Update: {
					active?: boolean | null
					created_at?: string
					href?: string | null
					href_label?: string | null
					id?: number
					message?: string | null
					name?: string | null
					tailwind_colour?: string | null
				}
				Relationships: []
			}
			pgms: {
				Row: {
					id: string
					ingress: Json | null
					intercom: number | null
					name: string | null
					orderIndex: number | null
					user: string | null
				}
				Insert: {
					id: string
					ingress?: Json | null
					intercom?: number | null
					name?: string | null
					orderIndex?: number | null
					user?: string | null
				}
				Update: {
					id?: string
					ingress?: Json | null
					intercom?: number | null
					name?: string | null
					orderIndex?: number | null
					user?: string | null
				}
				Relationships: [
					{
						foreignKeyName: 'pgm_feeds_intercom_fkey'
						columns: ['intercom']
						isOneToOne: false
						referencedRelation: 'intercoms'
						referencedColumns: ['id']
					},
					{
						foreignKeyName: 'pgm_feeds_user_fkey'
						columns: ['user']
						isOneToOne: false
						referencedRelation: 'users'
						referencedColumns: ['id']
					},
				]
			}
			roles: {
				Row: {
					channels: Json | null
					id: string
					intercom: number
					name: string | null
					orderIndex: number | null
					pgms: Json | null
					user: string | null
				}
				Insert: {
					channels?: Json | null
					id: string
					intercom: number
					name?: string | null
					orderIndex?: number | null
					pgms?: Json | null
					user?: string | null
				}
				Update: {
					channels?: Json | null
					id?: string
					intercom?: number
					name?: string | null
					orderIndex?: number | null
					pgms?: Json | null
					user?: string | null
				}
				Relationships: [
					{
						foreignKeyName: 'roles_intercom_fkey'
						columns: ['intercom']
						isOneToOne: false
						referencedRelation: 'intercoms'
						referencedColumns: ['id']
					},
					{
						foreignKeyName: 'roles_user_fkey'
						columns: ['user']
						isOneToOne: false
						referencedRelation: 'users'
						referencedColumns: ['id']
					},
				]
			}
			usage_statistics: {
				Row: {
					cleanupTime: string | null
					created_at: string
					creationTime: string | null
					id: number
					intercom: number | null
					interval: unknown | null
					maxParticipants: number | null
				}
				Insert: {
					cleanupTime?: string | null
					created_at?: string
					creationTime?: string | null
					id?: number
					intercom?: number | null
					interval?: unknown | null
					maxParticipants?: number | null
				}
				Update: {
					cleanupTime?: string | null
					created_at?: string
					creationTime?: string | null
					id?: number
					intercom?: number | null
					interval?: unknown | null
					maxParticipants?: number | null
				}
				Relationships: [
					{
						foreignKeyName: 'usage_statistics_intercom_fkey'
						columns: ['intercom']
						isOneToOne: false
						referencedRelation: 'intercomsv2'
						referencedColumns: ['id']
					},
				]
			}
			users: {
				Row: {
					companion_id: string | null
					email: string | null
					id: string
					mailerlite_id: string | null
					stripe_customer_id: string | null
					subscription_status: boolean
					username: string | null
				}
				Insert: {
					companion_id?: string | null
					email?: string | null
					id: string
					mailerlite_id?: string | null
					stripe_customer_id?: string | null
					subscription_status?: boolean
					username?: string | null
				}
				Update: {
					companion_id?: string | null
					email?: string | null
					id?: string
					mailerlite_id?: string | null
					stripe_customer_id?: string | null
					subscription_status?: boolean
					username?: string | null
				}
				Relationships: []
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			check_companion_id_exists: {
				Args: { input_companion_id: string }
				Returns: boolean
			}
			check_intercom_id_exists: {
				Args: { param_intercom_id: number }
				Returns: boolean
			}
			check_intercom_name_exists: {
				Args: { param_intercom_name: string }
				Returns: boolean
			}
			check_user_subscription_status: {
				Args: { user_id: string }
				Returns: boolean
			}
		}
		Enums: {
			pricing_plan_interval: 'day' | 'week' | 'month' | 'year'
			pricing_type: 'one_time' | 'recurring'
			subscription_status:
				| 'trialing'
				| 'active'
				| 'canceled'
				| 'incomplete'
				| 'incomplete_expired'
				| 'past_due'
				| 'unpaid'
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R
			}
			? R
			: never
		: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I
			}
			? I
			: never
		: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U
			}
			? U
			: never
		: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database
	}
		? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			pricing_plan_interval: ['day', 'week', 'month', 'year'],
			pricing_type: ['one_time', 'recurring'],
			subscription_status: ['trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid'],
		},
	},
} as const
