let easeeAPI=require('../easeeapi')

class control {
	constructor(platform, log, config) {
		this.log = log
		this.platform = platform
		this.easeeapi = new easeeAPI(this, log)
	}

	createControlService(device, state, type) {
		this.log.info('Adding amperage control for %s charger ', device.name)
		this.log.debug('create new control')
		let currentAmps
		if (this.platform.useFahrenheit) {
			currentAmps = ((state.dynamicChargerCurrent - 32) * 5 / 9).toFixed(1)
		}
		else {
			currentAmps = state.dynamicChargerCurrent
		}
		let switchOn = false
		if (state.chargerOpMode == 3) { switchOn = true}
		let controlService = new Service.Thermostat(type, device.id)
		controlService
			.setCharacteristic(Characteristic.Name, device.name + ' ' + type)
			.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.NO_FAULT)
			.setCharacteristic(Characteristic.TargetTemperature, currentAmps)
			.setCharacteristic(Characteristic.CurrentTemperature, currentAmps)
			.setCharacteristic(Characteristic.TemperatureDisplayUnits, this.platform.useFahrenheit)
			.setCharacteristic(Characteristic.TargetHeatingCoolingState, switchOn)
			.setCharacteristic(Characteristic.CurrentHeatingCoolingState, switchOn)
		return controlService
	}

	configureControlService(device, controlService) {
		let min
		let max
		let step
		if (this.platform.useFahrenheit) {
			min = -14.5
			max = 0
			step = .5
		}
		else {
			min = 6
			max = 32
			step = 1
		}

		this.log.debug("configured %s control for %s", controlService.getCharacteristic(Characteristic.Name).value, device.name)
		controlService
			.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.setProps({
				minValue: 0,
				maxValue: 1
			})
			.on('get', this.getControlState.bind(this, controlService))
			.on('set', this.setControlState.bind(this, device, controlService))
		controlService
			.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({
				minValue: min,
				maxValue: max,
				minStep: step
			})
		controlService
			.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({
				minValue: min,
				maxValue: max,
				minStep: step
			})
			.on('get', this.getControlAmps.bind(this, controlService))
			.on('set', this.setControlAmps.bind(this, device, controlService))
		controlService
			.getCharacteristic(Characteristic.TemperatureDisplayUnits)
			.on('get', this.getControlUnits.bind(this, controlService))
			.on('set', this.setControlUnits.bind(this, device, controlService))
	}

	async setControlAmps(device, controlService, value, callback) {
		if (controlService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
			callback('error')
		}
		else {
			let amps
			if (this.platform.useFahrenheit) {
				amps = (value * 1.8 + 32 + .01).toFixed(0)
			}
			else {
				amps = value.toFixed(0)
			}
			controlService.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
			this.log.warn('set dynamic current value to %s for %s', amps, device.id)
			this.easeeapi.dynamicCurrent(this.platform.token, device.id, amps).then(response => {
				switch (response.status) {
					case 200:
					case 202:
						controlService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(controlService.getCharacteristic(Characteristic.TargetTemperature).value)
						break
					case 400:
						controlService.getCharacteristic(Characteristic.TargetTemperature).updateValue(controlService.getCharacteristic(Characteristic.CurrentTemperature).value)
						this.log.info('Failed to set dynamic circuit %s', response.data.title)
						this.log.debug(response.data)
						break
					default:
						controlService.getCharacteristic(Characteristic.TargetTemperature).updateValue(controlService.getCharacteristic(Characteristic.CurrentTemperature).value)
						this.log.debug(response.data)
						break
				}
			})
			callback()
		}
	}

	setControlState(device, controlService, value, callback) {
		if (controlService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
			callback('error')
		}
		else {
			this.log.debug('set toggle to = %s', value)
			controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(value)
			if (value) {
				this.easeeapi.command(this.platform.token, device.id, 'resume_charging').then(response => {
					switch (response.status) {
						case 200:
						case 202:
							this.log.info('%s charging resumed', device.name)
							controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).value)
							break
						case 400:
							controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value)
							this.log.info('Failed to resume charging %s', response.data.title)
							this.log.debug(response.data)
							break
						default:
							controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value)
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
							controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).value)
							break
						case 400:
							controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value)
							this.log.info('Failed to pause charging %s', response.data.title)
							this.log.debug(response.data)
							break
						default:
							controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value)
							this.log.debug(response.data)
							break
					}
				})
			}
			callback()
		}
	}

	setControlUnits(device, controlService, value, callback) {
		if (controlService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
			callback('error')
		}
		else {
			//this.platform.useFahrenheit=value
			//controlService.getCharacteristic(Characteristic.TemperatureDisplayUnits).value=value
			this.log.debug("change unit value to %s", value)
			callback()
		}
	}

	getControlState(controlService, callback) {
		if (controlService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
			callback('error')
		}
		else {
			let currentValue = controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value
			callback(null, currentValue)
		}
	}

	getControlAmps(controlService, callback) {
		if (controlService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
			callback('error')
		}
		else {
			let currentValue = controlService.getCharacteristic(Characteristic.CurrentTemperature).value
			callback(null, currentValue)
		}
	}

	getControlUnits(controlService, callback) {
		if (controlService.getCharacteristic(Characteristic.StatusFault).value == Characteristic.StatusFault.GENERAL_FAULT) {
			callback('error')
		}
		else {
			let currentValue = controlService.getCharacteristic(Characteristic.TemperatureDisplayUnits).value
			this.platform.useFahrenheit = currentValue
			callback(null, currentValue)
		}
	}
}
module.exports = control