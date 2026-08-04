## WebComms Panel - v2.0.0-alpha

This module is for interacting directly with the webcomms.net intercom system.

### Breaking changes when migrating from v1
The ids used to identify channels in actions and feedback have been changed. Actions and feedbacks will need relinking in order to restore functionality.

### Configuration

- Enter your Companion Identity which you receive upon registration at www.webcomms.net. It can be found in your account settings or by clicking the Companion icon in the intercom room.
- Enter your room name which you wish to control.
- Click save which will then connect to the intercom system using the credentials you have entered.

### Available actions

- Toggle talking into a channel
- Toggle listening to a channel
- Set the volume of a channel

### Available feedbacks

- Current listen state of a channel
- Current talk state of a channel

### Available variables

- Volume of a channel
