import { type SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	port: number
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
