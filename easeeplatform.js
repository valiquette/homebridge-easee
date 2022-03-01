'use strict'
let easeeAPI=require('./easeeapi')
let easeeTestAPI=require('./easeeapitest')
let lockMechanism=require('./devices/lock')
let battery=require('./devices/battery')
let basicSwitch=require('./devices/switch')
let light=require('./devices/light')
let enumeration=require('./enumerations')

class easeePlatform {

  constructor(log, config, api){
    //this.easeeapi=new easeeAPI(this,log)
		this.lockMechanism=new lockMechanism(this, log, config)
		this.battery=new battery(this, log, config)
		this.basicSwitch=new basicSwitch(this, log, config)
		this.light=new light(this, log, config)
		this.enumeration=enumeration

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
		this.showControls=config.showControls
		this.showLight=config.showLight
		this.showExtraDebugMessages=false
    this.userId
		this.observations={}
		this.accessories=[]
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
			this.easeeapi.login(this.username,this.password).then(response=>{
				this.log.debug('Found Token %s',response.data.accessToken)
				this.log.debug('Found Token %s',response.data.refreshToken)
				this.token=response.data.accessToken 
				this.refreshToken=response.data.refreshToken 
				this.setTokenRefresh(response.data.expiresIn)
				//get token
				this.easeeapi.getObservations(this.token).then(response=>{this.observations.items=response.data}) //get list
				this.easeeapi.profile(this.token).then(response=>{
					this.log.info('Found account for %s %s', response.data.firstName, response.data.lastName)
					this.userId=response.data.userId
					//get product
					this.easeeapi.products(this.token,this.userId).then(response=>{
						this.log.info('Found products at %s %s', response.data[0].address.street,response.data[0].name)
						//loop each charger
						response.data[0].circuits.forEach((circuit)=>{
							circuit.chargers.forEach((charger)=>{
								this.log.info('Found charger %s with ID-%s ', charger.name, charger.id)
								this.easeeapi.getConfig(this.token,charger.id).then(response=>{
									let chargerConfig=response.data
									this.easeeapi.state(this.token,charger.id).then(response=>{
										let chargerState=response.data
										this.easeeapi.chargerDetails(this.token,charger.id).then(response=>{
											let chargerDetails=response.data
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
											
											let batteryService=this.battery.createBatteryService(charger)
											this.battery.configureBatteryService(batteryService)
											lockAccessory.getService(Service.LockMechanism).addLinkedService(batteryService)
											lockAccessory.addService(batteryService)
											//extras
											let switchService
											if(this.showLight){
												let lightService=this.light.createLightService(charger, chargerConfig, chargerState,'LED')
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
												switchService=this.basicSwitch.createSwitchService(charger,chargerState,'Pause/Resume')
												this.basicSwitch.configureSwitchService(charger, switchService)
												lockAccessory.getService(Service.LockMechanism).addLinkedService(switchService)
												lockAccessory.addService(switchService)
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
					this.easeeapi.refreshToken(this.token,this.refreshToken).then(response=>{
						this.log.debug('refreshed token %s',response.data.acessToken)
						this.token=response.data.acessToken 
						this.refreshToken=response.data.refreshToken 
						this.log.info('Token has been refreshed')
					}).catch(err=>{this.log.error('Failed signin to refresh token', err)})
				}catch(err){this.log.error('Failed to refresh token', err)}	
			},(ttl-3600)*1000/3) //refresh 1 hour before expire, /3 is dev

			}	

			updateService(message){
				let messageText=this.observations.items.filter(result=>result.observationId == message.id)[0].name
				this.log.info('%s %s(%s)=%s', message.mid, messageText, message.id, message.value)	

				let uuid=UUIDGen.generate(message.mid)	
				let lockAccessory=this.accessories[uuid]
				let activeService			
				let lockService
				let batteryService
				let value
				let valueText

				switch(message.dataType){
					case 1: {value=parseInt(message.value); break}
					case 2: {if(parseInt(message.value)){
							value=true
						}
						else{
							value=false
					}; break}
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
						this.log.info('%s %s changed to %s', message.mid, messageText, value)
						if(value>0){
							activeService=lockAccessory.getServiceById(Service.Lightbulb, message.mid)
							activeService.getCharacteristic(Characteristic.Brightness).updateValue(value)
						}
						else{
							activeService=lockAccessory.getServiceById(Service.Lightbulb, message.mid)
							activeService.getCharacteristic(Characteristic.On).updateValue(value)
						}
						this.log.debug('%s light brightness updated',activeService.getCharacteristic(Characteristic.Name).value)
						break	
					case 42://config_authorizationRequired
						this.log.info('%s changed to %s', message.mid, messageText, value)
						activeService=lockAccessory.getServiceById(Service.LockMechanism, message.mid)
						activeService.getCharacteristic(Characteristic.LockTargetState).updateValue(value)
						activeService.getCharacteristic(Characteristic.LockCurrentState).updateValue(value)
						this.log.debug('%s authorization updated',activeService.getCharacteristic(Characteristic.Name).value)
						break
					case 46://state_ledMode
						valueText=this.enumeration.data.ChargerLEDModeType[message.value]
						this.log.info('% %s to %s', message.mid, messageText, valueText)
						activeService=lockAccessory.getServiceById(Service.LockMechanism, message.mid)
						if(message.value>0){
							activeService=lockAccessory.getServiceById(Service.Lightbulb, message.mid)
							activeService.getCharacteristic(Characteristic.On).updateValue(true)
						}
						else{
							activeService=lockAccessory.getServiceById(Service.Lightbulb, message.mid)
							activeService.getCharacteristic(Characteristic.On).updateValue(false)
						}

						this.log.debug('%s light mode changed',activeService.getCharacteristic(Characteristic.Name).value)
						break
					case 47://config_maxChargerCurrent
						this.log.info('%s to %s', message.mid, messageText, value)
						break
					case 48://state_dynamicChargerCurrent
						this.log.info('%s changed to %s', message.mid, messageText, value)
						if(value>0){
							//batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(0)//stateOfCharge)
							//activeService=lockAccessory.getServiceById(Service.Switch, message.mid)
							//activeService.getCharacteristic(Characteristic.On).updateValue(!activeService.getCharacteristic(Characteristic.On).value)
						}
						else{
							//batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(0)//stateOfCharge)
							//activeService=lockAccessory.getServiceById(Service.Switch, message.mid)
							//activeService.getCharacteristic(Characteristic.On).updateValue(false)
						}
						break
					case 76://NumberOfCarsConnected
						this.log.info('% cars connected %s', message.mid, value)
						break
					case 77://NumberOfCarsCharging 
					this.log.info('% cars charging %s', message.mid, value)
						break
					case 78://NumberOfCarsInQueue
					this.log.info('% cars queued %s', message.mid, value)
						break
					case 79://NumberOfCarsFullyCharged
					this.log.info('% cars connected %s', message.mid, value)
						break
					case 96://state_reasonForNoCurrent
					valueText=this.enumeration.data.ReasonForNoCurrent[message.value]
					this.log.info('% %s to %s', message.mid, messageText, valueText)
							break	
					case 103://state_cableLocked
						this.log.info('% cable lock state to %s', message.mid, value)
						this.log.debug('%s cable lock updated',activeService.getCharacteristic(Characteristic.Name).value)					
						break
					case 109://state_chargerOpMode
						valueText=this.enumeration.data.OpModeType[message.value]
						this.log.info('% %s updated to %s', message.mid, messageText, valueText)
						activeService=lockAccessory.getServiceById(Service.Switch, message.mid)
						lockService=lockAccessory.getServiceById(Service.lockMechanism, message.mid)
						batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)
						switch (value){
							case 0:{//offline
								this.log.info('%s offline',lockService.getCharacteristic(Characteristic.Name).value)
								if(state.isOnline){
									lockService.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.NO_FAULT)
								}
								else{
									this.log.warn('%s disconnected at %s! This will show as non-responding in Homekit until the connection is restored.',chargerData.name, new Date(chargerData.lastConnection).toLocaleString())
									lockService.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.GENERAL_FAULT)
								}
								break
							}
							case 1:{//disconnected
								this.log.info('%s disconnected',lockService.getCharacteristic(Characteristic.Name).value)
								lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(false)
								//activeService.getCharacteristic(Characteristic.On).updateValue(false)
								break
							}
							case 2:{//awating start
								this.log.info('%s paused, waiting to start',lockService.getCharacteristic(Characteristic.Name).value)
								lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
								//activeService.getCharacteristic(Characteristic.On).updateValue(false)
								break
							}
							case 3:{//charging
								this.log.info('%s charging',lockService.getCharacteristic(Characteristic.Name).value)
								//activeService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
								break
							}
							case 4:{//complete
								this.log.info('%s complete',lockService.getCharacteristic(Characteristic.Name).value)
								//activeService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
								break
							}
							case 5:{//error
								this.log.info('%s error',lockService.getCharacteristic(Characteristic.Name).value)
								break
							}
							case 6:{//ready to charge
								this.log.info('%s ready to charge',lockService.getCharacteristic(Characteristic.Name).value)
								lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
								//activeService.getCharacteristic(Characteristic.On).updateValue(false)
								break
							}
							default:{
								this.log.warn('%s Unknown message received: %s',lockService.getCharacteristic(Characteristic.Name).value, message.value)
							break	
							}
						}
						break
					case 114:{//state_outputCurrent
						this.log.info('% %s changed to %s', message.mid, messageText, value)
						batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)
						activeService=lockAccessory.getServiceById(Service.Switch, message.mid)
						if(value>0){
							batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(true)
							activeService.getCharacteristic(Characteristic.On).updateValue(true)
						}
						else{
							batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(false)
							activeService.getCharacteristic(Characteristic.On).updateValue(false)
						}
						this.log.debug('%s output current updated',activeService.getCharacteristic(Characteristic.Name).value)
						break
						}
			}
	}	
}

module.exports=easeePlatform