let packageJson=require('../package.json')
let easeeAPI=require('../easeeapi')
let easeeTestAPI=require('../easeeapitest')

function lockMechanism (platform,log,config){
	this.log=log
	this.platform=platform
	//this.easeeapi=new easeeAPI(this,log)
	if (config.test){
		this.easeeapi=new easeeTestAPI(this,log)}
	else {
		this.easeeapi=new easeeAPI(this,log)}
}

lockMechanism.prototype={

  createLockAccessory(device, details, state, uuid){
    this.log.debug('Create Lock Accessory %s',device.name)
    let newPlatformAccessory=new PlatformAccessory(device.name, uuid)
    newPlatformAccessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, device.name)
      .setCharacteristic(Characteristic.Manufacturer, "Easee")
      .setCharacteristic(Characteristic.SerialNumber, details.serialNumber)
      .setCharacteristic(Characteristic.Model, details.product)
      .setCharacteristic(Characteristic.Identify, true)
			.setCharacteristic(Characteristic.ProductData,details.unitType)
      .setCharacteristic(Characteristic.FirmwareRevision, state.chargerFirmware.toString())
      .setCharacteristic(Characteristic.HardwareRevision, device.backPlate.masterBackPlateId)
      .setCharacteristic(Characteristic.SoftwareRevision, packageJson.version)
    return newPlatformAccessory
  },

  createLockService(device, details, state){
    this.log.debug("create Lock service for %s, serial number %s",device.name, details.serialNumber )
		let inUse
		if(state.chargerOpMode==1){inUse=false}else{inUse=true}
		let lockService=new Service.LockMechanism(device.name, device.id)
		lockService	
			.setCharacteristic(Characteristic.SerialNumber, details.serialNumber)
			.setCharacteristic(Characteristic.StatusFault, !state.isOnline)
			.setCharacteristic(Characteristic.OutletInUse, inUse)
			.setCharacteristic(Characteristic.AccessoryIdentifier, device.id)
    return lockService
  },

  configureLockService(lockService,config){
    this.log.info("Configured Lock for %s",lockService.getCharacteristic(Characteristic.Name).value)
    lockService
			.setCharacteristic(Characteristic.LockCurrentState, config.authorizationRequired)
			.setCharacteristic(Characteristic.LockTargetState, config.authorizationRequired)
		lockService
			.getCharacteristic(Characteristic.LockTargetState)
			.on('get', this.getLockTargetState.bind(this, lockService))
      .on('set', this.setLockTargetState.bind(this, lockService))
		lockService
			.getCharacteristic(Characteristic.LockCurrentState)
			.on('get', this.getLockCurrentState.bind(this, lockService))
  },

	getLockCurrentState: function (lockService, callback) {
		let currentValue=lockService.getCharacteristic(Characteristic.LockCurrentState).value
		callback(null,currentValue)
	},

	setLockCurrentState: function (lockService, value, callback) {
		this.log.info('Set State %s',lockService.getCharacteristic(Characteristic.Name).value)
		if(lockService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			if (value == true) {
				this.log.info('%s locked',lockService.getCharacteristic(Characteristic.Name).value)
				lockService.getCharacteristic(Characteristic.LockCurrentState).updatevalue(Characteristic.LockCurrentState.SECURED)
			} 
			else{
				this.log.info('%s unlocked',lockService.getCharacteristic(Characteristic.Name).value)
				lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(Characteristic.LockCurrentState.UNSECURED)
			}
			callback()
		}
	},

	getLockTargetState: function (lockService, callback) {
		let currentValue=lockService.getCharacteristic(Characteristic.LockTargetState).value
		callback(null,currentValue)
	},

	setLockTargetState: function (lockService, value, callback) {
		if(lockService.getCharacteristic(Characteristic.StatusFault).value==Characteristic.StatusFault.GENERAL_FAULT){
			callback('error')
		}
		else{
			if(value){
				this.log.info('Locking %s',lockService.getCharacteristic(Characteristic.Name).value)
				lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(Characteristic.LockTargetState.SECURED)
				let chargerId=lockService.getCharacteristic(Characteristic.SerialNumber).value
				this.easeeapi.lock(this.platform.token,chargerId,value).then(response=>{
					switch(response.status){
						case 200:
						case 202:
							break	
						case 400:
							lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(!value)
							this.log.info('Failed to start charging %s',response.data.title)
							this.log.debug(response.data)
							break
						default:
							lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(!value)
							this.log.debug(response.data)
							break	
						}
				})
			} 
			else{
				this.log.info('Unlocking %s',lockService.getCharacteristic(Characteristic.Name).value)
				lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(Characteristic.LockTargetState.UNSECURED)
				let chargerId=lockService.getCharacteristic(Characteristic.SerialNumber).value
				this.easeeapi.lock(this.platform.token,chargerId,value).then(response=>{
					switch(response.status){
						case 200:
						case 202:
							break	
						case 400:
							switchService.getCharacteristic(Characteristic.On).updateValue(!value)
							this.log.info('Failed to start charging %s',response.data.title)
							this.log.debug(response.data)
							break
						default:
							lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(value)
							this.log.debug(response.data)
							break	
						}
				})
			}
			callback()
		}
	}
}

module.exports = lockMechanism