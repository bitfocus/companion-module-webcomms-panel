## WebComms Panel - v2.1.0

This module is for interacting directly with the webcomms.net intercom system.

### Breaking changes when migrating from v1

The ids used to identify channels in actions and feedback have been changed. Actions and feedbacks will need relinking in order to restore functionality.

### Configuration

The v2 Companion module runs a local websocket server to communicate directly with your Web Comms browser tab/window. As such no further configuration is required unless you explicitly already have another application listening to port 7171, which is the default for this module. In the case that there is a clash and you are required to change it, it must be changed in the configuration tab in Companion as well as in the configuration in your Web Comms browser tab when joining the intercom system.

### Available actions

#### Channel actions

- Unmute channel input (microphone)
- Mute channel input (microphone)
- Toggle channel input (microphone)
- Mute channel output (speakers)
- Unumute channel output (speakers)
- Toggle channel output (speakers)
- Set channel volume

#### Panel actions

- Mute panel input (microphone)
- Unmute panel input (microphone)
- Toggle panel input (microphone)
- Mute panel output (speakers)
- Unmute panel output (speakers)
- Toggle panel output (speakers)

### Available feedbacks

- Current talk state of a channel
- Current listen state of a channel
- Current channel activity status of a channel
- Current input mute state of a panel
- Current output mute state of a panel
