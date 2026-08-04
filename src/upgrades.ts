import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig } from './config.js'

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */
	// function (context, props) {
	// 	return {
	// 		updatedConfig: null,
	// 		updatedActions: [],
	// 		updatedFeedbacks: [],
	// 	}
	// },

	function upgradeToV2(
		_: CompanionUpgradeContext<ModuleConfig>,
		props: CompanionStaticUpgradeProps<ModuleConfig, undefined>,
	): CompanionStaticUpgradeResult<ModuleConfig> {
		const updatedActions = props.actions.map((action) => {
			if (action.actionId === 'toggleTalk') {
				return { ...action, actionId: 'toggleChannelInput' }
			} else if (action.actionId === 'toggleListen') {
				return { ...action, actionId: 'toggleChannelOutput' }
			} else if (action.actionId === 'setVolume') {
				return { ...action, actionId: 'setChannelVolume' }
			} else return action
		})

		return {
			updatedConfig: {
				port: 7171,
			},
			updatedActions,
			updatedFeedbacks: [],
		}
	},
]
