let packageJson=require('../package.json')
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

  createLightService(device,details,type,dimable){
    this.log.debug('adding new switch')
    let lightService=new Service.Lightbulb(type, type) 
    lightService 
      .setCharacteristic(Characteristic.On, false)
      .setCharacteristic(Characteristic.Name, type)
      .setCharacteristic(Characteristic.StatusFault, false) // !device.is_connected)
    if(dimable){
      lightService.setCharacteristic(Characteristic.Brightness, details.ledStripBrightness)
    }  
    return lightService
  },

  configureLightService(device, lightService){
    this.log.info("Configured light for %s" ,lightService.getCharacteristic(Characteristic.Name).value)
    lightService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getLightValue.bind(this, lightService))
      .on('set', this.setLightValue.bind(this, device, lightService))
		lightService
      .getCharacteristic(Characteristic.Brightness)
      .on('get', this.getLightBrightness.bind(this, lightService))
      .on('set', this.setLightBrightness.bind(this, device, lightService))
  },

  setLightValue(device, lightService, value, callback){
    this.log.debug('light switch state %s',lightService.getCharacteristic(Characteristic.Name).value)
		if(lightService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			if(value){
				lightService.getCharacteristic(Characteristic.On).updateValue(value)
				/*
				this.easeeapi.light(this.platform.token,device,brightness).then(response=>{
					if(response.status=="200"){
						lightService.getCharacteristic(Characteristic.Brightness).updateValue(value)
					}
				})
				*/	
			} 
			callback()
		} 
  },

	setLightBrightness(device, lightService, value, callback){
    this.log.debug('light switch state %s',lightService.getCharacteristic(Characteristic.Name).value)
		if(lightService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			if(value){
				let maxValue=2147483647
				let brightness=maxValue*value
				this.log.warn(value, brightness)
				lightService.getCharacteristic(Characteristic.Brightness).updateValue(value)
				this.easeeapi.light(this.platform.token,device,brightness).then(response=>{
					if(response.status=="200"){
						lightService.getCharacteristic(Characteristic.Brightness).updateValue(value)
					}
				})	
			} 
			callback()
		} 
  },
	
	getLightValue(lightService, callback){
		//this.log.debug("%s=%s", lightService.getCharacteristic(Characteristic.Name).value,lightService.getCharacteristic(Characteristic.On))
		if(lightService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			let currentValue=lightService.getCharacteristic(Characteristic.On).value
			callback(null, currentValue)
		}
	}, 

	getLightBrightness(lightService, callback){
		//this.log.debug("%s=%s", lightService.getCharacteristic(Characteristic.Name).value,lightService.getCharacteristic(Characteristic.On))
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