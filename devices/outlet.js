let easeeAPI=require('homebridge-easee/easeeapi')

function basicOutlet (platform,log){
	this.log=log
	this.platform=platform
	this.easeeapi=new easeeAPI(this,log)
}

basicOutlet.prototype={

	createOutletService(device, state, type){
		this.log.debug('adding new outlet')
		let outletService=new Service.Outlet(type, device.id)
		let outletOn=false
		if(state.chargerOpMode==3){outletOn=true}
		outletService
		.setCharacteristic(Characteristic.On, outletOn)
		.setCharacteristic(Characteristic.Name, device.name+" "+type)
		.setCharacteristic(Characteristic.StatusFault,!state.isOnline)
		return outletService
	},

	createOtherOutletService(device, state, type){
		this.log.debug('adding other outlet')
		let uuid=UUIDGen.generate(device.id+type)
		let outletService=new Service.Outlet(type, uuid)
		let outletOn=false
		outletService
		.setCharacteristic(Characteristic.On, outletOn)
		.setCharacteristic(Characteristic.Name, device.name+" "+type)
		.setCharacteristic(Characteristic.StatusFault,!state.isOnline)
		return outletService
	},

	configureOutletService(device, outletService){
		this.log.info("Configured %s outlet for %s" , outletService.getCharacteristic(Characteristic.Name).value, device.name,)
		outletService
		.getCharacteristic(Characteristic.On)
		.on('get', this.getOutletValue.bind(this, outletService))
		.on('set', this.setOutletValue.bind(this, device, outletService))
	},

  setOutletValue(device, outletService, value, callback){
		this.log.debug('toggle outlet state %s',outletService.getCharacteristic(Characteristic.Name).value)
		this.log.debug('toggle %s',outletService.displayName)
		switch(outletService.displayName){
			case 'Start/Stop':
				if(outletService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
					callback('error')
				}
				else{
					if(value){
						this.easeeapi.command(this.platform.token,device.id,'start_charging').then(response=>{
							switch(response.status){
								case 200:
								case 202:
									this.log.info('%s charging started',device.name)
									break
								case 400:
									outletService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to start charging, %s',response.data.title)
									this.log.debug(response.data)
									break
								default:
									outletService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
								}
						})
					}
					else {
						this.easeeapi.command(this.platform.token,device.id,'stop_charging').then(response=>{
							switch(response.status){
								case 200:
								case 202:
									this.log.info('%s charging stopped',device.name)
									break
								case 400:
									outletService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to stop charging, %s',response.data.title)
									this.log.debug(response.data)
									break
								default:
									outletService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
								}
						})
					}
					callback()
				}
				break
			case 'Pause/Resume':
				if(outletService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
					callback('error')
				}
				else{
					if(value){
						this.easeeapi.command(this.platform.token,device.id,'resume_charging').then(response=>{
							switch(response.status){
								case 200:
								case 202:
									this.log.info('%s charging resumed',device.name)
									break
								case 400:
									outletService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to resume charging %s',response.data.title)
									this.log.debug(response.data)
									break
								default:
									outletService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
								}
						})
					}
					else {
						this.easeeapi.command(this.platform.token,device.id,'pause_charging').then(response=>{
							switch(response.status){
								case 200:
								case 202:
									this.log.info('%s charging paused',device.name)
									break
								case 400:
									outletService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.info('Failed to pause charging %s',response.data.title)
									this.log.debug(response.data)
									break
								default:
									outletService.getCharacteristic(Characteristic.On).updateValue(!value)
									this.log.debug(response.data)
									break
								}
						})
					}
					callback()
				}
				break
			case 'Toggle':
				if(outletService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
					callback('error')
				}
				else{
					this.easeeapi.command(this.platform.token,device.id,'toggle_charging').then(response=>{
					switch(response.status){
						case 200:
						case 202:
							this.log.info('%s charging state toggled',device.name)
							break
						case 400:
							outletService.getCharacteristic(Characteristic.On).updateValue(!value)
							this.log.info('Failed to toggle charging, %s',response.data.title)
							this.log.debug(response.data)
							break
						default:
							outletService.getCharacteristic(Characteristic.On).updateValue(!value)
							this.log.debug(response.data)
							break
						}
					})
				callback()
				}
				break
		}
  },

	getOutletValue(outletService, callback){
		//this.log.debug("%s=%s", outletService.getCharacteristic(Characteristic.Name).value,outletService.getCharacteristic(Characteristic.On).value)
		if(outletService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			let currentValue=outletService.getCharacteristic(Characteristic.On).value
			callback(null, currentValue)
		}
	}

}

module.exports = basicOutlet