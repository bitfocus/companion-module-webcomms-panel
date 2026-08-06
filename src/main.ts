import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import type { SyncResponse, ChannelSyncData } from './types.d.js'
import { Server, Socket } from 'socket.io'
import { createServer } from 'http'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpgradeScripts } from './upgrades.js'

export default class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig

	state: SyncResponse | undefined

	companionSyncTimeout: NodeJS.Timeout | undefined

	server = createServer()
	io = new Server(this.server, {
		cors: {
			origin: [/^https:\/\/.*\.webcomms\.net$/, 'http://localhost:5173', 'http://127.0.0.1:5173'],
		},
	})
	sockets: Socket[] = []

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.log('info', 'Initializing module')
		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions()
		this.updateFeedbacks()

		this.io.on('connect', (socket: Socket) => {
			this.log('info', 'New connection')
			this.sockets.push(socket)
			console.log(socket.connected)

			socket.on('syncResponse', (syncData: SyncResponse) => {
				console.debug('Sync Response Received', syncData)
				this.state = syncData
				this.updateActions()
				this.updateFeedbacks()
				this.checkFeedbacks('channelActivity', 'globalDeafen', 'globalMute', 'listenStatus', 'talkStatus')
			})

			socket.on('channelResponse', (channelData: ChannelSyncData) => {
				if (!this.state) {
					socket.emit('syncRequest')
					return
				}
				const channelFound = this.state.channels.findIndex((ch) => ch.id === channelData.id)

				if (channelFound === -1) return

				this.state.channels.splice(channelFound, 1, channelData)

				this.checkFeedbacks('channelActivity', 'globalDeafen', 'globalMute', 'listenStatus', 'talkStatus')
			})

			socket.on('disconnect', (reason) => {
				this.sockets = this.sockets.filter((s) => s.id !== socket.id)
				this.log('info', `Client disconnected: ${reason}`)
				if (this.sockets.length === 0) {
					this.state = undefined
					this.updateStatus(InstanceStatus.Disconnected, 'No panel connected')
				}
			})

			socket.emit('syncRequest')
		})

		const port = Number(this.config.port) || 7171
		if (!Number.isInteger(port) || port < 1024 || port > 65535) {
			this.updateStatus(InstanceStatus.BadConfig, 'Invalid port')
			return
		}

		this.server.listen(port, () => {
			this.log('debug', `Server listening on ${port}`)
			this.updateStatus(InstanceStatus.Ok)
		})
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.server.closeAllConnections()
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.state = undefined // Reset state on config update
		await this.init(config)
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
