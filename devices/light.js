let easeeAPI=require('../easeeapi')
let easeeTestAPI=require('../easeeapitest')

function light (platform,log,config){
	this.log=log
	this.platform=platform
	//this.easeeapi=new easeeAPI(this,log)
	if (config.test){
		this.easeeapi=new easeeTestAPI(this,log)}
	else {
		this.easeeapi=new easeeAPI(this,log)}
}

light.prototype={

  createLightService(device, config, state, type){
    this.log.debug('adding new switch')
    let lightService=new Service.Lightbulb(type, device.id) 
		let lightOn=false
		if(config.ledStripBrightness>0){lightOn=true}
    lightService 
      .setCharacteristic(Characteristic.On, lightOn)
      .setCharacteristic(Characteristic.Name, device.name+" "+type)
      .setCharacteristic(Characteristic.StatusFault, !state.isOnline)
      .setCharacteristic(Characteristic.Brightness, config.ledStripBrightness)
			.setCharacteristic(Characteristic.CurrentPosition, config.ledStripBrightness)
    return lightService
  },

  configureLightService(device, lightService){
    this.log.info("Configured %s light for %s" ,lightService.getCharacteristic(Characteristic.Name).value, device.name,)
    lightService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getLightValue.bind(this, lightService))
      .on('set', this.setLightValue.bind(this, device, lightService))
		lightService
      .getCharacteristic(Characteristic.Brightness)
			.setProps({
					minStep:10
				})
      .on('get', this.getLightBrightness.bind(this, lightService))
      .on('set', this.setLightBrightness.bind(this, device, lightService))
  },

  setLightValue(device, lightService, value, callback){
    this.log.debug('%s light switch state %s',lightService.getCharacteristic(Characteristic.Name).value, value)
		if(lightService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			if(value>0){
				value=lightService.getCharacteristic(Characteristic.CurrentPosition).value
				lightService.setCharacteristic(Characteristic.Brightness, value)
			}
			else{
				value=0
				lightService.setCharacteristic(Characteristic.Brightness, value)
			}
			callback()
		} 
  },

	setLightBrightness(device, lightService, value, callback){
    this.log.debug('%s light brightness = %s',lightService.getCharacteristic(Characteristic.Name).value, value)
		if(lightService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			lightService.getCharacteristic(Characteristic.Brightness).updateValue(value)
			if(value>0 && value<100){
				lightService.getCharacteristic(Characteristic.CurrentPosition).updateValue(value)
			}
			this.easeeapi.light(this.platform.token,device.id,value).then(response=>{
				switch(response.status){
					case 200:
					case 202:
						break	
					case 400:
						lightService.getCharacteristic(Characteristic.Brightness).updateValue(!value)
						this.log.info('Failed to start charging %s',response.data.title)
						this.log.debug(response.data)
						break
					default:
						lightService.getCharacteristic(Characteristic.Brightness).updateValue(value)
						this.log.debug(response.data)
						break	
					}
				})
			callback()
		} 
  },
	
	getLightValue(lightService, callback){
		if(lightService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			let currentValue=lightService.getCharacteristic(Characteristic.On).value
			callback(null, currentValue)
		}
	}, 

	getLightBrightness(lightService, callback){
		if(lightService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			let currentValue=lightService.getCharacteristic(Characteristic.Brightness).value
			callback(null, currentValue)
		}
	} 
}

module.exports = light