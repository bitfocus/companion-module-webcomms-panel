import { type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	companionIdentity: string
	intercomName: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'number',
			id: 'port',
			label: 'Port',
			width: 12,
			default: 7171,
			min: 0,
			max: 50000,
		},
	]
}
