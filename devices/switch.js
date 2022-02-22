let packageJson=require('../package.json')
let easeeAPI=require('../easeeapi')
let easeeTestAPI=require('../easeeapitest')

function basicSwitch (platform,log,config){
	this.log=log
	this.platform=platform
	//this.easeeapi=new easeeAPI(this,log)
	if (config.test){
		this.easeeapi=new easeeTestAPI(this,log)}
	else {
		this.easeeapi=new easeeAPI(this,log)}
}

basicSwitch.prototype={

  createSwitchService(device,details,type){
    this.log.debug('adding new switch')
		let switchService=new Service.Switch(type, type)
    switchService 
      .setCharacteristic(Characteristic.On, false)
      .setCharacteristic(Characteristic.Name, type)
      .setCharacteristic(Characteristic.StatusFault, false )//!device.is_connected)
    return switchService
  },

  configureSwitchService(device, switchService){
    this.log.info("Configured switch for %s" ,switchService.getCharacteristic(Characteristic.Name).value)
    switchService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getSwitchValue.bind(this, switchService))
      .on('set', this.setSwitchValue.bind(this, device, switchService))
  },
  setSwitchValue(device, switchService, value, callback){
    this.log.debug('toggle switch state %s',switchService.getCharacteristic(Characteristic.Name).value)
		//let chargerId=switchService.getCharacteristic(Characteristic.SerialNumber).value
		//this.log.warn(chargerId)
    switch(switchService.getCharacteristic(Characteristic.Name).value){
      case 'Start/Stop': 
        if(switchService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
          callback('error')
        }
        else{
          if(value){
            this.easeeapi.command(this.platform.token,device.id,'start_charging').then(response=>{
							if(response.status=="200"){
								switchService.getCharacteristic(Characteristic.On).updateValue(true)
							}
						})	
          } 
          else {
						this.easeeapi.command(this.platform.token,device.id,'stop_charging').then(response=>{
							if(response.status=="200"){
								switchService.getCharacteristic(Characteristic.On).updateValue(false)
							}
						})	
          }
          callback()
        } 
      	break
      case 'Pause/Resume': 
        if(switchService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
          callback('error')
        }
        else{
          if(value){
            this.easeeapi.command(this.platform.token,device.id,'resume_charging').then(response=>{
							if(response.status=="200"){
								switchService.getCharacteristic(Characteristic.On).updateValue(true)
							}
						})	
          } 
          else {
            this.easeeapi.command(this.platform.token,device.id,'pause_charging').then(response=>{
							if(response.status=="200"){
								switchService.getCharacteristic(Characteristic.On).updateValue(false)
							}
						})	
          }
          callback()
        }
				break
			case 'Toggle': 
			if(switchService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
				callback('error')
			}
			else{
				if(value){
					this.easeeapi.command(this.platform.token,device.id,'toggle_charging').then(response=>{
						if(response.status=="200"){
							switchService.getCharacteristic(Characteristic.On).updateValue(true)
						}
					})	
				} 
				else {
					this.easeeapi.command(this.platform.token,device.id,'toggle_charging').then(response=>{
						if(response.status=="200"){
							switchService.getCharacteristic(Characteristic.On).updateValue(false)
						}
					})	
				}
				callback()
			}
				break
    }
  },

	getSwitchValue(switchService, callback){
		//this.log.debug("%s=%s", switchService.getCharacteristic(Characteristic.Name).value,switchService.getCharacteristic(Characteristic.On).value)
		if(switchService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			currentValue=switchService.getCharacteristic(Characteristic.On).value
			callback(null, currentValue)
		}
	} 

}

module.exports = basicSwitch