import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import type { SyncResponse, ChannelSyncData } from './types.js'
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
			origin: [
				/^https:\/\/.*\.webcomms\.net$/,
				'https://webcomms.net',
				'http://localhost:5173',
				'http://127.0.0.1:5173',
			],
		},
	})
	socket?: Socket

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.log('info', 'Initializing module')

		this.updateActions()
		this.updateFeedbacks()
		this.bindClients()
		this.listen()
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.server.closeAllConnections()
		this.server.removeAllListeners()
		clearInterval(this.companionSyncTimeout)
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		const port = Number(config.port) || 7171
		const address = this.server.address()
		// Already bound. listen() again throws ERR_SERVER_ALREADY_LISTEN, and the host then never republishes settings.
		if (this.server.listening && typeof address === 'object' && address?.port === port) {
			this.config = config
			return
		}

		this.config = config
		this.state = undefined
		if (this.server.listening) await this.closeServer()
		this.listen()
	}

	bindClients(): void {
		this.io.on('connect', (socket: Socket) => {
			this.log('info', 'New connection')
			this.socket = socket

			socket.on('syncResponse', (syncData: SyncResponse) => {
				this.log('debug', 'sync response received from Web Comms')
				this.state = syncData
				this.updateStatus(InstanceStatus.Ok)
				this.updateActions()
				this.updateFeedbacks()
				this.checkFeedbacks('channelActivity', 'globalDeafen', 'globalMute', 'listenStatus', 'talkStatus')
			})

			socket.on('channelResponse', (channelData: ChannelSyncData) => {
				if (!this.state) {
					this.startSyncPolling(socket)
					return
				}
				const channelFound = this.state.channels.findIndex((ch) => ch.id === channelData.id)

				if (channelFound === -1) return

				this.state.channels.splice(channelFound, 1, channelData)

				if (channelData.name !== this.state.channels.at(channelFound)!.name) {
					this.updateActions()
					this.updateFeedbacks()
				}

				this.checkFeedbacks('channelActivity', 'globalDeafen', 'globalMute', 'listenStatus', 'talkStatus')
			})

			socket.on('disconnect', (reason) => {
				if (this.socket) {
					this.socket = undefined
				}

				this.state = undefined
				this.updateStatus(InstanceStatus.Disconnected, 'No panel connected')
				this.log('info', `Client disconnected: ${reason}`)
				return
			})

			this.startSyncPolling(socket)
		})
	}

	async closeServer(): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			this.server.close((error) => {
				if (error) reject(error)
				else resolve()
			})
			this.server.closeAllConnections()
		})
	}

	listen(): void {
		const port = Number(this.config.port) || 7171
		if (!Number.isInteger(port) || port < 1024 || port > 65535) {
			this.updateStatus(InstanceStatus.BadConfig, 'Invalid port')
			return
		}

		this.updateStatus(InstanceStatus.Connecting)
		this.server.listen(port, () => {
			this.log('debug', `Server listening on ${port}`)
		})
	}

	startSyncPolling(socket: Socket): void {
		if (this.companionSyncTimeout || this.state) return

		this.companionSyncTimeout = setInterval(() => {
			if (this.state && this.companionSyncTimeout) clearInterval(this.companionSyncTimeout)
			else {
				this.log('debug', 'requesting sync from panel')
				socket.emit('syncRequest')
			}
		}, 2000)
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
