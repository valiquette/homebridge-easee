let easeeAPI=require('../easeeapi')

class basicSwitch {
	constructor(platform, log) {
		this.log = log
		this.platform = platform
		this.easeeapi = new easeeAPI(this, log)
	}

	createSwitchService(device, state, type) {
		this.log.debug('adding new switch')
		let switchService = new Service.Switch(type, device.id)
		let switchOn = false
		if (state.chargerOpMode == 3) { switchOn = true}
		switchService
			.setCharacteristic(Characteristic.On, switchOn)
			.setCharacteristic(Characteristic.Name, device.name + " " + type)
			.setCharacteristic(Characteristic.StatusFault, !state.isOnline)
		return switchService
	}

	createOtherSwitchService(device, state, type) {
		this.log.debug('adding other switch')
		let uuid = UUIDGen.generate(device.id + type)
		let switchService = new Service.Switch(type, uuid)
		let switchOn = false
		switchService
			.setCharacteristic(Characteristic.On, switchOn)
			.setCharacteristic(Characteristic.Name, device.name + " " + type)
			.setCharacteristic(Characteristic.StatusFault, !state.isOnline)
		return switchService
	}

	configureSwitchService(device, switchService) {
		this.log.info("Configured %s switch for %s", switchService.getCharacteristic(Characteristic.Name).value, device.name)
		switchService
			.getCharacteristic(Characteristic.On)
			.on('get', this.getSwitchValue.bind(this, switchService))
			.on('set', this.setSwitchValue.bind(this, device, switchService))
	}

	setSwitchValue(device, switchService, value, callback) {
		this.log.debug('toggle switch state %s', switchService.getCharacteristic(Characteristic.Name).value)
		this.log.debug('toggle %s', switchService.displayName)
		switch (switchService.displayName) {
			case 'Start/Stop':
				if (switchService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
					callback('error')
				}
				else {
					if (value) {
						this.easeeapi.command(this.platform.token, device.id, 'start_charging').then(response => {
							switch (response.status) {
								case 200:
								case 202:
									this.log.info('%s charging started', device.name)
									break
								case 400:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to start charging, %s', response.data.title)
									this.log.debug(response.data)
									break
								default:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
							}
						})
					}
					else {
						this.easeeapi.command(this.platform.token, device.id, 'stop_charging').then(response => {
							switch (response.status) {
								case 200:
								case 202:
									this.log.info('%s charging stopped', device.name)
									break
								case 400:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to stop charging, %s', response.data.title)
									this.log.debug(response.data)
									break
								default:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
							}
						})
					}
					callback()
				}
				break
			case 'Pause/Resume':
				if (switchService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
					callback('error')
				}
				else {
					if (value) {
						this.easeeapi.command(this.platform.token, device.id, 'resume_charging').then(response => {
							switch (response.status) {
								case 200:
								case 202:
									this.log.info('%s charging resumed', device.name)
									break
								case 400:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to resume charging %s', response.data.title)
									this.log.debug(response.data)
									break
								default:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
							}
						})
					}
					else {
						this.easeeapi.command(this.platform.token, device.id, 'pause_charging').then(response => {
							switch (response.status) {
								case 200:
								case 202:
									this.log.info('%s charging paused', device.name)
									break
								case 400:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to pause charging %s', response.data.title)
									this.log.debug(response.data)
									break
								default:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
							}
						})
					}
					callback()
				}
				break
			case 'Toggle':
				if (switchService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
					callback('error')
				}
				else {
					this.easeeapi.command(this.platform.token, device.id, 'toggle_charging').then(response => {
						switch (response.status) {
							case 200:
							case 202:
								this.log.info('%s charging state toggled', device.name)
								break
							case 400:
								switchService.getCharacteristic(Characteristic.On).updateValue(!value)
								this.log.info('Failed to toggle charging, %s', response.data.title)
								this.log.debug(response.data)
								break
							default:
								switchService.getCharacteristic(Characteristic.On).updateValue(!value)
								this.log.debug(response.data)
								break
						}
					})
					callback()
				}
				break
			case 'Reboot':
				if (switchService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
					callback('error')
				}
				else {
					this.easeeapi.command(this.platform.token, device.id, 'reboot').then(response => {
						switch (response.status) {
							case 200:
							case 202:
								this.log.info('%s reboot', device.name)
								break
							case 400:
								switchService.getCharacteristic(Characteristic.On).updateValue(!value)
								this.log.info('Failed to reboot, %s', response.data.title)
								this.log.debug(response.data)
								break
							default:
								switchService.getCharacteristic(Characteristic.On).updateValue(!value)
								this.log.debug(response.data)
								break
						}
					})
					callback()
				}
				break
			case 'Start Now':
				if (switchService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
					callback('error')
				}
				else {
					if (value) {
						this.easeeapi.overrideSchedule(this.platform.token, device.id).then(response => {
							switch (response.status) {
								case 200:
								case 202:
									switchService.getCharacteristic(Characteristic.On).updateValue(false)
									this.log.info('%s Schedule overridden', device.name)
									break
								case 400:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to override, %s', response.data.title)
									this.log.debug(response.data)
									break
								default:
									switchService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
							}
						})
					}
					callback()
				}
				break
		}
	}

	getSwitchValue(switchService, callback) {
		//this.log.debug("%s=%s", switchService.getCharacteristic(Characteristic.Name).value,switchService.getCharacteristic(Characteristic.On).value)
		if (switchService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
			callback('error')
		}
		else {
			let currentValue = switchService.getCharacteristic(Characteristic.On).value
			callback(null, currentValue)
		}
	}
}
module.exports = basicSwitch