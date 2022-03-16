'use strict'
let easeeAPI=require('./easeeapi')
let easeeTestAPI=require('./easeeapitest')
let lockMechanism=require('./devices/lock')
let battery=require('./devices/battery')
let basicSwitch=require('./devices/switch')
let light=require('./devices/light')
let enumeration=require('./enumerations')
let observations=require('./observations')

class easeePlatform {

  constructor(log, config, api){
    //this.easeeapi=new easeeAPI(this,log)
		this.lockMechanism=new lockMechanism(this, log, config)
		this.battery=new battery(this, log, config)
		this.basicSwitch=new basicSwitch(this, log, config)
		this.light=new light(this, log, config)
		this.enumeration=enumeration
		this.observations=observations

    this.log=log
    this.config=config
		if (config.test){
			this.easeeapi=new easeeTestAPI(this, log)}
		else {
			this.easeeapi=new easeeAPI(this, log)}
    this.username=config.username
    this.password=config.password
    this.token
		this.refreshToken
		this.showBattery=config.showBattery
		this.showControls=config.showControls
		this.showLight=config.showLight
		this.showReboot=config.showReboot
		this.showOverride=config.showOverride
		this.showExtraDebugMessages=config.showExtraDebugMessages||false
    this.userId
		this.cars=config.cars
		this.voltage=240
		this.amperage=40
		this.locationAddress=config.locationAddress
		this.locationMatch
		this.observations={}
		this.accessories=[]
		this.amps=[]
		this.endTime=[]
		if(config.cars){this.showBattery=true}
    if(!config.username || !config.password){
      this.log.error('Valid username and password are required in order to communicate with easee, please check the plugin config')
    }
      this.log.info('Starting Easee Platform using homebridge API', api.version)
      if(api){
        this.api=api
        this.api.on("didFinishLaunching", function (){
          // Get devices
          this.getDevices()
        }.bind(this))
      }
    }

		identify (){
			this.log.info('Identify easee!')
		}

		getDevices(){
			this.log.debug('Fetching Build info...')
			this.log.info('Getting Account info...')
			// login to the API and get the token
			this.easeeapi.login(this.username,this.password).then(login=>{
				this.log.debug('Found Token %s',login.data.accessToken)
				this.log.debug('Found Token %s',login.data.refreshToken)
				this.token=login.data.accessToken 
				this.refreshToken=login.data.refreshToken 
				this.setTokenRefresh(login.data.expiresIn)
				//get token
				this.easeeapi.getObservations(this.token).then(list=>{this.observations.items=list.data}) //get new list
				this.easeeapi.profile(this.token).then(profile=>{
					this.log.info('Found account for %s %s', profile.data.firstName, profile.data.lastName)
					this.userId=profile.data.userId
					//get product
					this.easeeapi.products(this.token,this.userId).then(products=>{
						products.data.filter((location)=>{
							this.log.info('Found products at %s %s', location.address.street, location.name)
						//	this.log.warn(this.locationAddress, location.address.street )
							if(!this.locationAddress || this.locationAddress==location.address.street){
								this.log.info('Adding location %s found at the configured location: %s',location.name,location.address.street)
								this.locationMatch=true
							} 
							else{
								this.log.info('Skipping location %s at %s, not found at the configured location: %s',location.name,location.address.street,this.locationAddress,)
								this.locationMatch=false
							}
							return this.locationMatch
						}).forEach((location)=>{
							//adding devices that met filter criteria
							location.circuits.forEach((circuit)=>{
								//loop each charger	
								circuit.chargers.forEach((charger)=>{
									this.log.info('Found charger %s with ID-%s ', charger.name, charger.id)
									this.easeeapi.getConfig(this.token,charger.id).then(configInfo=>{
										let chargerConfig=configInfo.data
										this.easeeapi.state(this.token,charger.id).then(tokenInfo=>{
											let chargerState=tokenInfo.data
											this.easeeapi.chargerDetails(this.token,charger.id).then(detail=>{
												let chargerDetails=detail.data
												let uuid=UUIDGen.generate(charger.id)							
												if(this.accessories[uuid]){
													this.api.unregisterPlatformAccessories(PluginName, PlatformName, [this.accessories[uuid]])
													delete this.accessories[uuid]
												}
												this.log.info('Adding Lock for %s charger ', charger.name)
												this.log.debug('Registering platform accessory')

												let lockAccessory=this.lockMechanism.createLockAccessory(charger,chargerDetails,chargerState,uuid)
												let lockService=this.lockMechanism.createLockService(charger,chargerDetails,chargerState)
												this.lockMechanism.configureLockService(lockService, chargerConfig)
												lockAccessory.addService(lockService)

												//extras
												let batteryService
												let lightService
												let switchService
												let rebootService
												let overrideService
												
												if(this.showBattery){
													batteryService=this.battery.createBatteryService(charger,chargerConfig)
													this.battery.configureBatteryService(batteryService)
													lockAccessory.getService(Service.LockMechanism).addLinkedService(batteryService)
													lockAccessory.addService(batteryService)
												}
												if(this.showLight){
													lightService=this.light.createLightService(charger, chargerConfig, chargerState,'LED')
													this.light.configureLightService(charger, lightService)
													lockAccessory.getService(Service.LockMechanism).addLinkedService(lightService)
													lockAccessory.addService(lightService)
												}
												if(this.showControls==1){
													switchService=this.basicSwitch.createSwitchService(charger, chargerState,'Toggle')
													this.basicSwitch.configureSwitchService(charger, switchService)
													lockAccessory.getService(Service.LockMechanism).addLinkedService(switchService)
													lockAccessory.addService(switchService)
												}
												if(this.showControls==2){
													switchService=this.basicSwitch.createSwitchService(charger, chargerState,'Start/Stop')
													this.basicSwitch.configureSwitchService(charger, switchService)
													lockAccessory.getService(Service.LockMechanism).addLinkedService(switchService)
													lockAccessory.addService(switchService)
												}
												if(this.showControls==3){
													switchService=this.basicSwitch.createSwitchService(charger, chargerState,'Pause/Resume')
													this.basicSwitch.configureSwitchService(charger, switchService)
													lockAccessory.getService(Service.LockMechanism).addLinkedService(switchService)
													lockAccessory.addService(switchService)
												}
												if(this.showReboot){
													rebootService=this.basicSwitch.createOtherSwitchService(charger, chargerState,'Reboot')
													this.basicSwitch.configureSwitchService(charger, rebootService)
													lockAccessory.getService(Service.LockMechanism).addLinkedService(rebootService)
													lockAccessory.addService(rebootService)
												}
												if(this.showOverride){
													overrideService=this.basicSwitch.createOtherSwitchService(charger, chargerState,'Start Now')
													this.basicSwitch.configureSwitchService(charger, overrideService)
													lockAccessory.getService(Service.LockMechanism).addLinkedService(overrideService)
													lockAccessory.addService(overrideService)
												}
												this.accessories[uuid]=lockAccessory                
												this.log.info('Adding Charger Lock for %s', charger.name)
												this.log.debug('Registering platform accessory')
												this.api.registerPlatformAccessories(PluginName, PlatformName, [lockAccessory])
												this.easeeapi.signalR(this.token,charger.id)
											}).catch(err=>{this.log.error('Failed to get info for build', err)})
										}).catch(err=>{this.log.error('Failed to get info for build', err)})
									}).catch(err=>{this.log.error('Failed to get info for build', err)})
								})
							})
						})
					}).catch(err=>{this.log.error('Failed to get info for build', err)})
				}).catch(err=>{this.log.error('Failed to get info for build', err)})
			}).catch(err=>{this.log.error('Failed to get info for build', err)})
		}

		//**
		//** REQUIRED - Homebridge will call the "configureAccessory" method once for every cached accessory restored
		//**
		configureAccessory(accessory){
			// Added cached devices to the accessories arrary
			this.log.debug('Found cached accessory %s', accessory.displayName);
			this.accessories[accessory.UUID]=accessory;
		}

		setTokenRefresh(ttl){
			setInterval(()=>{		
				try{		
					this.easeeapi.refreshToken(this.token,this.refreshToken).then(tokenInfo=>{
						this.log.debug('refreshed token %s',tokenInfo.data.acessToken)
						this.token=tokenInfo.data.acessToken 
						this.refreshToken=tokenInfo.data.refreshToken 
						this.log.info('Token has been refreshed')
					}).catch(err=>{this.log.error('Failed signin to refresh token', err)})
				}catch(err){this.log.error('Failed to refresh token', err)}	
			},(ttl-3600)*1000) //refresh 1 hour before expire

		}	

		calcBattery(batteryService){
			if(this.cars){
				let car=this.cars.filter(charger=>(charger.chargerName.includes(batteryService.getCharacteristic(Characteristic.Name).value)))
				this.batterySize=car[0].kwH
			}
			else{
				this.batterySize=80
			}
			this.amperage=this.amps[batteryService.subtype]
			let kwh=this.voltage*this.amperage/1000 
			let fullCharge=(this.batterySize)/(kwh)
			let x=new Date(0,0)
			x.setSeconds(fullCharge*60*60)
			let fullChargeTime=x.toTimeString().slice(0,8)
			this.log.info('Charging time for 100% charge ',fullChargeTime)								
			let startTime= Date.now()
			let endTime=setInterval(()=>{		
					try{		
							let runningTime=Date.now()-startTime
							let chargeAdded=((this.amperage*this.voltage/1000)*(runningTime/60/60/1000)).toFixed(2)
							let percentAdded=(chargeAdded/this.batterySize*100).toFixed(2)
							//this.log.warn('Charge added %s kwh, %s%',chargeAdded,percentAdded)
							batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(percentAdded)
							if(percentAdded>100){
								clearInterval(endTime)
						}
					}catch(err){this.log.error('Failed', err)}	
			},1*60*1000)
			this.endTime[batteryService.subtype]=endTime
		}	

		updateService(message){
			let messageText=this.observations.items.filter(result=>result.observationId == message.id)[0].name
			this.log.debug('%s %s(%s)=%s', message.mid, messageText, message.id, message.value)	

			let uuid=UUIDGen.generate(message.mid)	
			let lockAccessory=this.accessories[uuid]
			let activeService			
			let lockService
			let batteryService
			let value
			let valueText

			switch(message.dataType){
				case 1: {value=parseInt(message.value); break}
				case 2: {if(parseInt(message.value)){value=true} else{value=false}; break}
				case 3: {value=parseFloat(message.value); break}
				case 4: {value=parseInt(message.value); break}
				case 5: {value=(message.value); break}
				case 6: {value=(message.value); break}
				case 7: {value=(message.value); break}
			}

			switch(message.id){
				case 11://ChargerOfflineReason
				this.log.info('% offline reason %s', message.mid, value)
					break
				case 40://config_ledStripBrightness
					if(this.showLight){
						this.log.info('%s %s changed to %s', message.mid, messageText, value)
						activeService=lockAccessory.getServiceById(Service.Lightbulb, message.mid)
						if(value>0){						
							activeService.getCharacteristic(Characteristic.Brightness).updateValue(value)
							activeService.getCharacteristic(Characteristic.CurrentPosition).updateValue(value)
						}
						else{
							activeService.getCharacteristic(Characteristic.On).updateValue(value)
						}
						this.log.debug('%s light brightness updated',activeService.getCharacteristic(Characteristic.Name).value)
					}
					break	
				case 42://config_authorizationRequired
					this.log.info('%s %s changed to %s', message.mid, messageText, value)
					activeService=lockAccessory.getServiceById(Service.LockMechanism, message.mid)
					activeService.getCharacteristic(Characteristic.LockTargetState).updateValue(value)
					activeService.getCharacteristic(Characteristic.LockCurrentState).updateValue(value)
					this.log.debug('%s authorization updated',activeService.getCharacteristic(Characteristic.Name).value)
					break
				case 46://state_ledMode
					if(this.showLight){
						valueText=this.enumeration.data.ChargerLEDModeType[message.value]
						this.log.info('%s %s to %s', message.mid, messageText, valueText)
						activeService=lockAccessory.getServiceById(Service.Lightbulb, message.mid)
						if(message.value>0){
							activeService.getCharacteristic(Characteristic.On).updateValue(true)
						}
						else{
							activeService.getCharacteristic(Characteristic.On).updateValue(false)
						}
						this.log.debug('%s light mode changed',activeService.getCharacteristic(Characteristic.Name).value)
					}
					break
				case 47://config_maxChargerCurrent
					if(this.showBattery){
						this.log.info('%s to %s', message.mid, messageText, value)
						batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)
						this.amps[batteryService.subtype]=value
					}
					break
				case 48://state_dynamicChargerCurrent
					this.log.info('%s changed to %s', message.mid, messageText, value)
					if(value>0){
						//this.amps[batteryService.subtype]=value
					}
					else{
						if(this.showReboot){
							activeService=lockAccessory.getServiceById(Service.Switch,UUIDGen.generate(message.mid+'Reboot'))
							activeService.getCharacteristic(Characteristic.On).updateValue(false)
						}
					}
					break
				case 76://NumberOfCarsConnected
					this.log.info('%S cars connected %s', message.mid, value)
					break
				case 77://NumberOfCarsCharging 
					this.log.info('%S cars charging %s', message.mid, value)
					break
				case 78://NumberOfCarsInQueue
					this.log.info('%s cars queued %s', message.mid, value)
					break
				case 79://NumberOfCarsFullyCharged
					this.log.info('%s cars connected %s', message.mid, value)
					break
				case 96://state_reasonForNoCurrent
					valueText=this.enumeration.data.ReasonForNoCurrent[message.value]
					this.log.info('%s %s to %s', message.mid, messageText, valueText)
						break	
				case 103://state_cableLocked
					this.log.info('%s cable lock state to %s', message.mid, value)
					this.log.debug('%s cable lock updated',activeService.getCharacteristic(Characteristic.Name).value)					
					break
				case 109://state_chargerOpMode
					valueText=this.enumeration.data.OpModeType[message.value]
					this.log.info('%s updated to %s', message.mid, messageText, valueText)
					lockService=lockAccessory.getServiceById(Service.LockMechanism, message.mid)
					if(this.showControls){activeService=lockAccessory.getServiceById(Service.Switch, message.mid)}
					if(this.showBattery){batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)}
					switch(value){
						case 0://offline
							this.log.info('%s offline',lockService.getCharacteristic(Characteristic.Name).value)
							if(state.isOnline){
								lockService.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.NO_FAULT)
							}
							else{
								this.log.warn('%s disconnected at %s! This will show as non-responding in Homekit until the connection is restored.',chargerData.name, new Date(chargerData.lastConnection).toLocaleString())
								lockService.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.GENERAL_FAULT)
							}
							break
						case 1://disconnected
							this.log.info('%s disconnected',lockService.getCharacteristic(Characteristic.Name).value)
							lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(false)
							if(this.showBattery){batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(0)}
							break
						case 2://awating start
							this.log.info('%s paused, waiting to start',lockService.getCharacteristic(Characteristic.Name).value)
							lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
							//add delay
							break
						case 3://charging
							this.log.info('%s charging',lockService.getCharacteristic(Characteristic.Name).value)
							if(this.showBattery){this.calcBattery(batteryService)}
							break
						case 4://complete
							this.log.info('%s complete, %s% charge added',lockService.getCharacteristic(Characteristic.Name).value,batteryService.getCharacteristic(Characteristic.BatteryLevel).value)
								if(this.showBattery){clearInterval(this.endTime[batteryService.subtype])}
							break
						case 5://error
							this.log.info('%s error',lockService.getCharacteristic(Characteristic.Name).value)
							break
						case 6://ready to charge
							this.log.info('%s ready to charge',lockService.getCharacteristic(Characteristic.Name).value)
							lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
							break
						default:
							this.log.warn('%s Unknown message received: %s',lockService.getCharacteristic(Characteristic.Name).value, message.value)
						break	
					}
					break
				case 114://state_outputCurrent
					this.log.info('%s %s changed to %s', message.mid, messageText, value)
					if(this.showBattery){batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)}
					if(this.showControls){activeService=lockAccessory.getServiceById(Service.Switch, message.mid)}
					if(value>0){
						if(this.showBattery){batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(true)}
						if(this.showControls){activeService.getCharacteristic(Characteristic.On).updateValue(true)}
					}
					else{
						if(this.showBattery){batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(false)}
						if(this.showControls){activeService.getCharacteristic(Characteristic.On).updateValue(false)}
					}
					this.log.debug('%s output current updated',activeService.getCharacteristic(Characteristic.Name).value)
					break
		}
	}	
}

module.exports=easeePlatform