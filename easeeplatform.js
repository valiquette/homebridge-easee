'use strict'
let easeeAPI=require('./easeeapi')
let easeeTestAPI=require('./easeeapitest')
let lockMechanism=require('./devices/lock')
let battery=require('./devices/battery')
let basicSwitch=require('./devices/switch')
let light=require('./devices/light')


class easeePlatform {

  constructor(log, config, api){
    //this.easeeapi=new easeeAPI(this,log)
		this.lockMechanism=new lockMechanism(this, log, config)
		this.battery=new battery(this, log, config)
		this.basicSwitch=new basicSwitch(this, log, config)
		this.light=new light(this, log, config)

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
		this.refreshRate=config.refreshRate||30
		this.showStartStop=config.showStartStop
		this.showPauseResume=config.showPauseResume
		this.showToggle=config.showToggle
		this.showLight=config.showLight
    this.userId
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
										
										let batteryService=this.battery.createBatteryService(charger,chargerDetails,chargerState)
										this.battery.configureBatteryService(batteryService)
										lockAccessory.getService(Service.LockMechanism).addLinkedService(batteryService)
										lockAccessory.addService(batteryService)
										//extras
										let switchService
										if(this.showLight){
											let lightService=this.light.createLightService(charger,chargerConfig,chargerState,'LED')
											this.light.configureLightService(charger, lightService)
											lockAccessory.getService(Service.LockMechanism).addLinkedService(lightService)
											lockAccessory.addService(lightService)
										}
										if(this.showStartStop){
											switchService=this.basicSwitch.createSwitchService(charger,chargerConfig,chargerState,'Start/Stop')
											this.basicSwitch.configureSwitchService(charger, switchService)
											lockAccessory.getService(Service.LockMechanism).addLinkedService(switchService)
											lockAccessory.addService(switchService)
										}
										if(this.showPauseResume){
											switchService=this.basicSwitch.createSwitchService(charger,chargerConfig,chargerState,'Pause/Resume')
											this.basicSwitch.configureSwitchService(charger, switchService)
											lockAccessory.getService(Service.LockMechanism).addLinkedService(switchService)
											lockAccessory.addService(switchService)
										}
										if(this.showToggle){
											switchService=this.basicSwitch.createSwitchService(charger,chargerConfig,chargerState,'Toggle')
											this.basicSwitch.configureSwitchService(charger, switchService)
											lockAccessory.getService(Service.LockMechanism).addLinkedService(switchService)
											lockAccessory.addService(switchService)
										}
										this.accessories[uuid]=lockAccessory                     
										this.log.info('Adding Charger Lock for %s', charger.name)
										this.log.debug('Registering platform accessory')
										this.api.registerPlatformAccessories(PluginName, PlatformName, [lockAccessory])
										this.setChargerRefresh(lockService, batteryService, charger.id)
										this.updateStatus(lockService, batteryService, chargerState, chargerConfig )
									}).catch(err=>{this.log.error('Failed to get info for build', err)})
								}).catch(err=>{this.log.error('Failed to get info for build', err)})
							}).catch(err=>{this.log.error('Failed to get info for build', err)})
						})
					})
				}).catch(err=>{this.log.error('Failed to get info for build', err)})
			}).catch(err=>{this.log.error('Failed to get info for build', err)})
		}).catch(err=>{this.log.error('Failed to get info for build', err)})
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
		},ttl*1000)

		}	

		setChargerRefresh(lockService, batteryService, id){
			// Refresh charger status	
				setInterval(()=>{		
					try{		
						this.easeeapi.state(this.token, id).then(state=>{
							this.easeeapi.getConfig(this.token, id).then(config=>{
								this.log.debug('refreshed charger %s connection', id)
								this.updateStatus(lockService, batteryService, state.data, config.data)
							}).catch(err=>{this.log.error('Failed to refresh charger connection', err)})
						}).catch(err=>{this.log.error('Failed to refresh charger connection', err)})
						}catch(err){this.log.error('Failed to refresh charger connection', err)}	
				}, this.refreshRate*60*1000)
			}

		updateStatus(lockService, batteryService, state, config){
			/*
			chargerOpMode
			0: "OFFLINE"
			1: "DISCONNECTED"
			2: "AWAITING_START"
			3: "CHARGING"
			4: "COMPLETED"
			5: "ERROR"
			6: "READY_TO_CHARGE"
			reasonForNoCurrent
			0: "No reason, charging or ready to charge",
			1: "Charger paused",
			2: "Charger paused",
			3: "Charger paused",
			4: "Charger paused",
			5: "Charger paused",
			6: "Charger paused",
			9: "Error no current",
			50: "Secondary unit not requesting current or no car connected",
			51: "Charger paused",
			52: "Charger paused",
			53: "Charger disabled",
			54: "Waiting for schedule/auth",
			55: "Pending auth"
			*/
			switch (state.chargerOpMode){
				case 0: {//offline
					this.log.info("%s offline",lockService.getCharacteristic(Characteristic.Name).value)
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
					this.log.info("%s disconnected",lockService.getCharacteristic(Characteristic.Name).value)
					lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(state.cableLocked)
					lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(config.authorizationRequired)
					lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(config.authorizationRequired)
					batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(Characteristic.ChargingState.NOT_CHARGING)
					break
				}
				case 2:{//awating start
					this.log.info("%s waiting to start",lockService.getCharacteristic(Characteristic.Name).value)
					lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(state.cableLocked)
					batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(Characteristic.ChargingState.NOT_CHARGING)
					break
				}
				case 3:{//charging
					this.log.info("%s charging",lockService.getCharacteristic(Characteristic.Name).value)
					lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(state.cableLocked)
					lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(config.authorizationRequired)
					lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(config.authorizationRequired)
					batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(0)//stateOfCharge)
					batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(Characteristic.ChargingState.CHARGING)
					break
				}
				case 4:{//complete
					this.log.info("%s complete",lockService.getCharacteristic(Characteristic.Name).value)
					lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(state.cableLocked)
					lockService.getCharacteristic(Characteristic.LockCurrentState).updateValue(config.authorizationRequired)
					lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(config.authorizationRequired)
					batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(Characteristic.ChargingState.NOT_CHARGING)
					break
				}
				case 5:{//error
					this.log.info("%s error",lockService.getCharacteristic(Characteristic.Name).value)
					break
				}
				case 6:{//ready to charge
					this.log.info("%s ready to charge",lockService.getCharacteristic(Characteristic.Name).value)
					lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(state.cableLocked)
					batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(Characteristic.ChargingState.NOT_CHARGING)
					break
				}
				default:
					this.log.warn('%s Unknown message received: %s',lockService.getCharacteristic(Characteristic.Name).value, state.chargerOpMode)
				break	
			}
			
		}	
  //**
  //** REQUIRED - Homebridge will call the "configureAccessory" method once for every cached accessory restored
  //**
  configureAccessory(accessory){
    // Added cached devices to the accessories arrary
    this.log.debug('Found cached accessory %s', accessory.displayName);
    this.accessories[accessory.UUID]=accessory;
  }
}

module.exports=easeePlatform