let packageJson=require('homebridge-easee/package.json')
let easeeAPI=require('homebridge-easee/easeeapi')

function equalizer (platform,log,config){
	this.log=log
	this.platform=platform
	this.config=config
	this.easeeapi=new easeeAPI(this,log)
	this.x=0
	this.eqMin=this.config.eqMin || 15
	this.eqMax=this.config.eqMax || 100
}

equalizer.prototype={
	createWindowAccessory(device, details, state, uuid){
		this.log.debug('Create Window Accessory for Equalizer %s',device.name)
		let newPlatformAccessory=new PlatformAccessory(device.name, uuid)
		newPlatformAccessory.getService(Service.AccessoryInformation)
		.setCharacteristic(Characteristic.Name, device.name)
		.setCharacteristic(Characteristic.Manufacturer, "Easee")
		.setCharacteristic(Characteristic.SerialNumber, details.equalizerId)
		.setCharacteristic(Characteristic.Model, "Equalizer")
		.setCharacteristic(Characteristic.Identify, true)
			//.setCharacteristic(Characteristic.ProductData,details.unitType)
		.setCharacteristic(Characteristic.FirmwareRevision, state.softwareRelease.toString())
		.setCharacteristic(Characteristic.HardwareRevision, details.masterBackPlateId)
		.setCharacteristic(Characteristic.SoftwareRevision, packageJson.version)
		return newPlatformAccessory
	},

	createWindowService(device, details, config, state){
		this.log.debug("create Window service for Equalizer %s, serial number %s",device.name, config.serialNumber )
		let windowService=new Service.WindowCovering(device.name, device.id)
		windowService
			.setCharacteristic(Characteristic.SerialNumber, details.serialNumber)
			.setCharacteristic(Characteristic.StatusFault, !state.isOnline)
			.setCharacteristic(Characteristic.AccessoryIdentifier, device.id)
    return windowService
  },

  configureWindowService(windowService, config){
		this.log.info("Configured Equalizer for %s",windowService.getCharacteristic(Characteristic.Name).value)
		let percent=Math.round(config.siteStructure.maxAllocatedCurrent/config.siteStructure.ratedCurrent*100)
		if(this.platform.experimental){
			percent=Math.round(config.siteStructure.maxContinuousCurrent/config.siteStructure.ratedCurrent*100)
		}
		windowService
		.setCharacteristic(Characteristic.CurrentPosition, percent)
		.setCharacteristic(Characteristic.TargetPosition, percent)
		.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED)
		windowService
			.getCharacteristic(Characteristic.CurrentPosition)
			.setProps({
				minValue:0,
				maxValue:100,
				minStep:1
			})
			.on('get', this.getCurrentPosition.bind(this, windowService))
      .on('set', this.setCurrentPosition.bind(this, windowService))
		windowService
			.getCharacteristic(Characteristic.TargetPosition)
			.setProps({
				minValue:0,
				maxValue:100,
				minStep:1
			})
			.on('get', this.getTargetPosition.bind(this, windowService))
			.on('set', this.setTargetPosition.bind(this, windowService, config))
	},

	getTargetPosition: function (windowService, callback) {
		let currentValue=windowService.getCharacteristic(Characteristic.TargetPosition).value
		callback(null,currentValue)
	},

	getCurrentPosition: function (windowService, callback) {
		let currentValue=windowService.getCharacteristic(Characteristic.CurrentPosition).value
		callback(null,currentValue)
	},

	setCurrentPosition: function (windowService, value, callback) {
		this.log.info('Set State %s',windowService.getCharacteristic(Characteristic.Name).value)
		if(windowService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			if (value == true) {
				windowService.getCharacteristic(Characteristic.CurrentPosition).updatevalue(Characteristic.TargetPosition.value)
			}
			else{
				windowService.getCharacteristic(Characteristic.CurrentPosition).updateValue(Characteristic.TargetPosition.value)
			}
			callback()
		}
	},

	setTargetPosition: function (windowService, config, value, callback) {
		if(windowService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			clearTimeout(this.x)
			this.x=setTimeout(() => {
				if(this.eqMin>=this.eqMax){
					this.log.warn('Equalizer min-max values are inverted, will use default 15-100')
					this.eqMin=15
					this.eqMax=100
				}
				if(value>this.eqMax){
					this.log.warn('Limits out of range, will use max value. Check high limits in config')
					value=this.eqMax
				}
				if(value<this.eqMin){
					this.log.warn('Limits out of range, will use min value. Check low limits in config')
					value=this.eqMin
				}
				if(this.platform.experimental){
					convertedValue=Math.round(config.siteStructure.ratedCurrent*value/100)
					this.log.info('Changing Equalizer %s Max Continuous Current',windowService.getCharacteristic(Characteristic.AccessoryIdentifier).value)
					this.log.debug ('equalizer %s, fuse size %s, new max continuous current %s',this.platform.eq, this.platform.siteStructure.ratedCurrent, convertedValue)
					this.log.debug('set max continuous current value to %s or equivalent of %s%', convertedValue, value)
					this.easeeapi.configureEqualizerFuse(this.platform.token, this.platform.eq, this.platform.siteStructure.ratedCurrent, convertedValue).then(response=>{
						switch(response.status){
							case 200:
							case 202:
								windowService.getCharacteristic(Characteristic.CurrentPosition).updateValue(windowService.getCharacteristic(Characteristic.TargetPosition).value)
								break
							case 400:
								windowService.getCharacteristic(Characteristic.TargetPosition).updateValue(windowService.getCharacteristic(Characteristic.CurrentPosition).value)
								this.log.info('Failed to adjust equalizer %s',response.data.title)
								this.log.debug(response.data)
								break
							default:
								windowService.getCharacteristic(Characteristic.TargetPosition).updateValue(windowService.getCharacteristic(Characteristic.CurrentPosition).value)
								this.log.debug(response.data)
								break
							}
					})
				}
				else{
					convertedValue=Math.round(config.siteStructure.ratedCurrent*value/100)
					this.log.info('Changing Equalizer %s Max Allocated Current',windowService.getCharacteristic(Characteristic.AccessoryIdentifier).value)
					this.log.debug ('equalizer %s, rated current %s, new max allocated current %s',this.platform.eq, this.platform.siteStructure.ratedCurrent, convertedValue)
					this.log.debug('set max allocated value to %s or equivalent of %s%', convertedValue, value)
					this.easeeapi.setMaxAllocatedCurrent(this.platform.token, this.platform.eq, convertedValue).then(response=>{
						switch(response.status){
							case 200:
							case 202:
								windowService.getCharacteristic(Characteristic.CurrentPosition).updateValue(windowService.getCharacteristic(Characteristic.TargetPosition).value)
								break
							case 400:
								windowService.getCharacteristic(Characteristic.TargetPosition).updateValue(windowService.getCharacteristic(Characteristic.CurrentPosition).value)
								this.log.info('Failed to adjust equalizer %s',response.data.title)
								this.log.debug(response.data)
								break
							default:
								windowService.getCharacteristic(Characteristic.TargetPosition).updateValue(windowService.getCharacteristic(Characteristic.CurrentPosition).value)
								this.log.debug(response.data)
								break
							}
					})
				}
			}, 2500)
			callback()
		}
	}
}

module.exports = equalizer