import { type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	companionIdentity: string
	intercomName: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'companionIdentity',
			label: 'Companion Identity',
			width: 12,
			default: '',
		},
		{
			type: 'textinput',
			id: 'intercomName',
			label: 'Intercom Name',
			width: 12,
			default: '',
		},
	]
}
