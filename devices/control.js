let easeeAPI=require('../easeeapi')

function control (platform,log,config){
	this.log=log
	this.platform=platform
	this.easeeapi=new easeeAPI(this,log)
	this.dynamicTTL=config.dynamicTTL || 1
}

control.prototype={

  createControlService(device, state, type){
		this.log.info('Adding amperage control for %s charger ', device.name)
		this.log.debug('create new control')
		let currentAmps
		if(this.platform.useFahrenheit){
		currentAmps=((state.dynamicChargerCurrent-32+.01)*5/9).toFixed(2)
		}
		else{
			currentAmps=state.dynamicChargerCurrent
		}
		let controlService=new Service.Thermostat(type, device.id)
    controlService
      .setCharacteristic(Characteristic.Name, device.name+' '+type)
      .setCharacteristic(Characteristic.StatusFault,Characteristic.StatusFault.NO_FAULT)
			.setCharacteristic(Characteristic.TargetTemperature, currentAmps)
			.setCharacteristic(Characteristic.CurrentTemperature, currentAmps)
			.setCharacteristic(Characteristic.TemperatureDisplayUnits,this.platform.useFahrenheit)
			.setCharacteristic(Characteristic.TargetHeatingCoolingState,0)
			.setCharacteristic(Characteristic.CurrentHeatingCoolingState,0)
    return controlService
  },

  configureControlService(device, controlService, circuitId, siteId, ){
		let min
		let max
		let step
		if(this.platform.useFahrenheit){
			min=-14.5
			max=0
			step=.5
		}
		else{
			min=6
			max=32
			step=1
		}

    this.log.debug("configured %s control for %s" , controlService.getCharacteristic(Characteristic.Name).value, device.name)
		controlService
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.setProps({
					minValue:0,
					maxValue:1
				})
      .on('get', this.getControlState.bind(this, controlService))
      .on('set', this.setControlState.bind(this, device, controlService))
		controlService
		.getCharacteristic(Characteristic.CurrentTemperature)
		.setProps({
				minValue:min,
				maxValue:max,
				minStep:step
		})
		controlService
      .getCharacteristic(Characteristic.TargetTemperature)
			.setProps({
					minValue:min,
					maxValue:max,
					minStep:step
			})
      .on('get', this.getControlAmps.bind(this, controlService))
      .on('set', this.setControlAmps.bind(this, device, controlService, siteId, circuitId,))
		controlService
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
			.on('get', this.getControlUnits.bind(this, controlService))
      .on('set', this.setControlUnits.bind(this, device, controlService))
  },

	async setControlAmps(device, controlService, siteId, circuitId, value, callback){
		if(controlService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			let amps
			if(this.platform.useFahrenheit){
				amps=(value*1.8+32+.01).toFixed(0)
			}
			else{
				amps=value.toFixed(0)
			}
			controlService.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
			let phases=(await this.easeeapi.getDynamicCircuitCurrent(this.platform.token, siteId, circuitId).catch(err=>{this.log.error('Failed to get comfig info for build', err)})).data
			this.log.info('current dynamic circuit current %s',phases)
			let p1=amps
			let p2=amps
			let p3=amps
			if(phases.phase1 == 0){p1=0}
			if(phases.phase2 == 0){p2=0}
			if(phases.phase3 == 0){p3=0}
			this.log.debug('set dynamic current value to { phase1: %s, phase2: %s, phase3: %s } for site=%s circuit=%s for %s minutes', p1, p2 ,p3, siteId, circuitId, this.dynamicTTL)
			this.easeeapi.setDynamicCircuitCurrent(this.platform.token, siteId, circuitId, p1,p2,p3,this.dynamicTTL).then(response=>{
				switch(response.status){
					case 200:
					case 202:
						controlService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(controlService.getCharacteristic(Characteristic.TargetTemperature).value)
						break
					case 400:
						controlService.getCharacteristic(Characteristic.TargetTemperature).updateValue(controlService.getCharacteristic(Characteristic.CurrentTemperature).value)
						this.log.info('Failed to set dynamic circuit %s',response.data.title)
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
	},

	setControlState(device, controlService, value, callback){
		if(controlService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			this.log.debug('set toggle to = %s', value)
			controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(value)
			this.easeeapi.command(this.platform.token,device.id,'toggle_charging').then(response=>{
				switch(response.status){
					case 200:
					case 202:
						controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).value)
						this.log.info('%s charging state toggled',device.name)
						break
					case 400:
						controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value)
						this.log.info('Failed to toggle charging, %s',response.data.title)
						this.log.debug(response.data)
						break
					default:
						controlService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value)
						this.log.debug(response.data)
						break
					}
			})
			callback()
		}
  },

	setControlUnits(device, controlService, value, callback){
		if(controlService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			//this.platform.useFahrenheit=value
			//controlService.getCharacteristic(Characteristic.TemperatureDisplayUnits).value=value
			this.log.debug("change unit value to %s",value)
			callback()
		}
	},

	getControlState(controlService, callback){
		if(controlService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			let currentValue=controlService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).value
			callback(null, currentValue)
		}
	},

	getControlAmps(controlService, callback){
		if(controlService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			let currentValue=controlService.getCharacteristic(Characteristic.CurrentTemperature).value
			callback(null, currentValue)
		}
	},

	getControlUnits(controlService, callback){
		if(controlService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			let currentValue=controlService.getCharacteristic(Characteristic.TemperatureDisplayUnits).value
			this.platform.useFahrenheit=currentValue
			callback(null, currentValue)
		}
	}

}

module.exports = control