'use strict'
let easeeAPI=require('./easeeapi')
//let easeeAPI=require('./testeaseeapi')
let lockMechanism=require('./devices/lock')
let battery=require('./devices/battery')
let basicSwitch=require('./devices/switch')
let light=require('./devices/light')
let equalizer=require('./devices/equalizer')
let sensor=require('./devices/sensor')
let control=require('./devices/control')
let enumeration=require('./enumerations')
let observations=require('./observations')

class easeePlatform {

  constructor(log, config, api){
    this.easeeapi=new easeeAPI(this, log)
		this.lockMechanism=new lockMechanism(this, log)
		this.battery=new battery(this, log)
		this.basicSwitch=new basicSwitch(this, log)
		this.light=new light(this, log)
		this.equalizer=new equalizer(this, log, config)
		this.sensor=new sensor(this, log)
		this.control=new control(this, log, config)
		this.enumeration=enumeration
		this.observations=observations

    this.log=log
    this.config=config
    this.username=config.username
    this.password=config.password
    this.token
		this.refreshToken
		this.retryWait=config.retryWait || 60 //sec
		this.showBattery=config.showBattery
		this.showControls=config.showControls
		this.showLight=config.showLight
		this.showReboot=config.showReboot
		this.showOverride=config.showOverride
		this.showExtraDebugMessages=config.showExtraDebugMessages||false
		this.showSensor=config.socSensor ? config.socSensor : false
		this.showEqualizer=config.showEqualizer ? config.showEqualizer : false
		this.experimental=config.experimental ? config.experimental : false
		this.useFahrenheit=config.useFahrenheit ? config.useFahrenheit : true
		this.eq
		this.siteStructure={}
    this.userId
		this.cars=config.cars
		this.voltage=240
		this.amperage=32
		this.locationAddress=config.locationAddress
		this.locationMatch
		this.observations={}
		this.accessories=[]
		this.amps=[]
		this.endTime=[]
		if(this.showControls==5){
			this.showControls=4
			this.useFahrenheit=false
		}
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

		async getDevices(){
			try
			{
				this.log.debug('Fetching Build info...')
				this.log.info('Getting Account info...')
				//get new observation list
				this.observations.items=(await this.easeeapi.getObservations().catch(err=>{this.log.error('Failed to get observation list for build', err)})).data
				this.log.debug('Retrieved %s observations',observations.items.length)
				// login to the API and get the token
				let login=(await this.easeeapi.login(this.username,this.password).catch(err=>{this.log.error('Failed to get login for build', err)})).data
				this.log.debug('Found Token %s',login.accessToken)
				this.log.debug('Found Token %s',login.refreshToken)
				this.token=login.accessToken
				this.refreshToken=login.refreshToken
				this.setTokenRefresh(login.expiresIn)
				//get profile
				let profile=(await	this.easeeapi.profile(this.token).catch(err=>{this.log.error('Failed to get profile for build', err)})).data
				this.log.info('Found account for %s %s', profile.firstName, profile.lastName)
				this.userId=profile.userId
				//get product
				let products=(await this.easeeapi.products(this.token,this.userId).catch(err=>{this.log.error('Failed to get products for build', err)})).data
				products.filter((location)=>{
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
				}).forEach(async(location)=>{
					//adding devices that met filter criteria
					location.circuits.forEach((circuit)=>{
						//loop each charger
						circuit.chargers.forEach(async(charger)=>{
							this.log.info('Found charger %s with ID-%s ', charger.name, charger.id)
							this.log.info('Circuit ID %s Site ID-%s ', circuit.id, circuit.siteId)
							let chargerConfig=(await this.easeeapi.chargerConfig(this.token,charger.id).catch(err=>{this.log.error('Failed to get charger config info for build', err)})).data
							let chargerState=(await this.easeeapi.chargerState(this.token,charger.id).catch(err=>{this.log.error('Failed to get charger state for build', err)})).data
							let chargerDetails=(await this.easeeapi.chargerDetails(this.token,charger.id).catch(err=>{this.log.error('Failed to get charger detail info for build', err)})).data
							this.log.info('Phase mode = %s', this.enumeration.data.PhaseMode[chargerConfig.phaseMode])
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
							let controlService
							let rebootService
							let overrideService

							if(this.showSensor){
								let sensorService=this.sensor.createSensorService(charger,'SOC')
								this.sensor.configureSensorService(charger,sensorService)
								lockAccessory.getService(Service.LockMechanism).addLinkedService(sensorService)
								lockAccessory.addService(sensorService)
							}
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
							if(this.showControls==4){
								controlService=this.control.createControlService(charger, chargerState, 'Charging Amps')
								this.control.configureControlService(charger, controlService, circuit.id, circuit.siteId)
								lockAccessory.getService(Service.LockMechanism).addLinkedService(controlService)
								lockAccessory.addService(controlService)
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
							//this.resetSignalR(864000,charger)
						})
					})
					if(this.showEqualizer && location.equalizers[0]){
						this.eq=location.equalizers[0].id
						let equalizerConfig=(await this.easeeapi.equalizerConfig(this.token,location.equalizers[0].id).catch(err=>{this.log.error('Failed to get equalizer config info for build', err)})).data
						let equalizerState=(await this.easeeapi.equalizerState(this.token,location.equalizers[0].id).catch(err=>{this.log.error('Failed to get equalizer state for build', err)})).data
						let equalizerDetails=(await this.easeeapi.equalizerDetails(this.token,location.equalizers[0].id).catch(err=>{this.log.error('Failed to get equalizer detail info for build', err)})).data
						let uuid2=UUIDGen.generate(location.equalizers[0].id)
						this.siteStructure=equalizerConfig.siteStructure
						if(this.accessories[uuid2]){
							this.api.unregisterPlatformAccessories(PluginName, PlatformName, [this.accessories[uuid2]])
							delete this.accessories[uuid2]
						}
						this.log.info('Adding Equalizer %s for site ID %s', location.equalizers[0].name, location.equalizers[0].siteId)
						this.log.debug('Registering platform accessory')
						let windowAccessory=this.equalizer.createWindowAccessory(location.equalizers[0], equalizerConfig, equalizerState, uuid2)
						let windowService=this.equalizer.createWindowService(location.equalizers[0], equalizerDetails, equalizerConfig, equalizerState)
						this.equalizer.configureWindowService(windowService, equalizerConfig)
						windowAccessory.addService(windowService)

						this.accessories[uuid2]=windowAccessory
						this.log.info('Adding Equalizer %s', location.equalizers[0].name)
						this.log.debug('Registering platform accessory')
						this.api.registerPlatformAccessories(PluginName, PlatformName, [windowAccessory])
					}
					else{
						if(location.equalizers[0].id){
							let uuid2=UUIDGen.generate(location.equalizers[0].id)
							if(this.accessories[uuid2]){
								this.log.info('Removed accessory %s', location.equalizers[0].name)
								this.api.unregisterPlatformAccessories(PluginName, PlatformName, [this.accessories[uuid2]])
								delete this.accessories[uuid2]
							}
						}
					}
				})
				setTimeout(()=>{this.log.info('Easee Platform finished loading')}, 500)
			}catch(err){
				this.log.error('Failed to get devices...%s \nRetrying in %s seconds...', err,this.retryWait)
				setTimeout(async()=>{
					this.getDevices()
				},this.retryWait*1000)
			}
		}

		//**
		//** REQUIRED - Homebridge will call the "configureAccessory" method once for every cached accessory restored
		//**
		configureAccessory(accessory){
			// Added cached devices to the accessories array
			this.log.debug('Found cached accessory %s', accessory.displayName)
			this.accessories[accessory.UUID]=accessory
		}

		setTokenRefresh(ttl){
			setInterval(async()=>{
				try{
					let tokenInfo=(await this.easeeapi.refreshToken(this.token,this.refreshToken).catch(err=>{this.log.error('Failed signin to refresh token', err)})).data
					this.log.debug('refreshed token %s',tokenInfo.accessToken)
					this.token=tokenInfo.accessToken
					this.refreshToken=tokenInfo.refreshToken
					this.log.info('Token has been refreshed')
				}catch(err){this.log.error('Failed to refresh token', err)}
			},(ttl*1000/2))//3600*1000))//(ttl-3600)*1000) //refresh 1 hour before
		}

		resetSignalR(ttl,charger){
			setInterval(()=>{
				try{
					this.log.info('SignalR has been reset')
					this.easeeapi.signalR(this.token,charger.id)
				}catch(err){this.log.error('Failed to reset SignalR', err)}
			},((ttl*1000/2)+(600*1000)))//4000*1000))//(ttl-3600)*1000) //refresh 1 hour before expire
		}

		calcBattery(batteryService, sensorService){
			if(this.cars){
				let car=this.cars.filter(charger=>(charger.chargerName.includes(batteryService.getCharacteristic(Characteristic.Name).value)))
				this.batterySize=car[0].kwH
			}
			else{
				this.batterySize=80
			}
			if(this.amps[batteryService.subtype]){this.amperage=this.amps[batteryService.subtype]}
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
						if(this.showSensor){
							sensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(percentAdded)
						}
						if(percentAdded>100){
							clearInterval(endTime)
						}
					}catch(err){this.log.error('Failed', err)}
			},1*60*1000)
			this.endTime[batteryService.subtype]=endTime
			this.endTime[sensorService.subtype]=endTime
		}

		async updateEq(windowService,eqId){
				try{
					let equalizerConfig=(await this.easeeapi.equalizerConfig(this.token,eqId).catch(err=>{this.log.error('Failed to get comfig info for build', err)})).data
					let percent=Math.round(equalizerConfig.siteStructure.maxAllocatedCurrent/equalizerConfig.siteStructure.ratedCurrent*100)
					if(this.experimental){
						percent=Math.round(equalizerConfig.siteStructure.maxContinuousCurrent/equalizerConfig.siteStructure.ratedCurrent*100)
					}
					this.log.debug('updating equalizer %s with new value %s%',eqId, percent)
					windowService.getCharacteristic(Characteristic.TargetPosition).updateValue(percent)
					windowService.getCharacteristic(Characteristic.CurrentPosition).updateValue(percent)
				}catch(err){this.log.error('Failed to update equalizer', err)}
		}

	  updateService(message){
			let messageText=this.observations.items.filter(result=>result.observationId == message.id)[0].name
			this.log.debug('%s %s(%s)=%s', message.mid, messageText, message.id, message.value)
			let uuid=UUIDGen.generate(message.mid)
			let uuid2=UUIDGen.generate(this.eq)
			let lockAccessory=this.accessories[uuid]
			let windowAccessory=this.accessories[uuid2]
			let activeService
			let lockService
			let windowService
			let batteryService
			let sensorService
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
						this.log.info('%s %s updated to %s', message.mid, messageText, value)
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
					this.log.info('%s %s updated to %s', message.mid, messageText, value)
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
						this.log.info('%s %s updated to %s', message.mid, messageText, value)
						batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)
						this.amps[batteryService.subtype]=value
					}
					if(this.showSensor){
						this.log.info('%s %s updated to %s', message.mid, messageText, value)
						sensorService=lockAccessory.getServiceById(Service.HumiditySensor, message.mid)
						this.amps[sensorService.subtype]=value
					}
					/* //moved to case 48
					if(this.showControls==(4||5)){
						this.log.info('%s %s updated to %s', message.mid, messageText, value)
						controlService=lockAccessory.getServiceById(Service.Thermostat, message.mid)
						controlService.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
						controlService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(value)
					}
					*/
					break
				case 48://state_dynamicChargerCurrent
					this.log.info('%s %s updated to %s', message.mid, messageText, value)
					if(value>0){
						if(this.showBattery){
							this.log.info('%s %s updated to %s', message.mid, messageText, value)
							batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)
							this.amps[batteryService.subtype]=value
						}
						if(this.showSensor){
							this.log.info('%s %s updated to %s', message.mid, messageText, value)
							sensorService=lockAccessory.getServiceById(Service.HumiditySensor, message.mid)
							this.amps[sensorService.subtype]=value
						}
						if(this.showControls==(4||5)){
							this.log.info('%s %s updated to %s', message.mid, messageText, value)
							controlService=lockAccessory.getServiceById(Service.Thermostat, message.mid)
							controlService.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
							controlService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(value)
						}
					}
					else{
						if(this.showReboot){
							activeService=lockAccessory.getServiceById(Service.Switch,UUIDGen.generate(message.mid+'Reboot'))
							activeService.getCharacteristic(Characteristic.On).updateValue(false)
						}
					}
					break
				case 65://Paired equalizer details
					this.log.warn('%S Equalizer %s', message.mid, value)
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
					this.log.info('%s %s due to %s', message.mid, messageText, valueText)
						break
				case 103://state_cableLocked
					this.log.info('%s cable lock state to %s', message.mid, value)
					this.log.debug('%s cable lock updated',activeService.getCharacteristic(Characteristic.Name).value)
					break
				case 109://state_chargerOpMode
					valueText=this.enumeration.data.OpModeType[message.value]
					this.log.info('%s updated to %s', message.mid, messageText, valueText)
					lockService=lockAccessory.getServiceById(Service.LockMechanism, message.mid)
					if(this.showControls==(1||2||3)){activeService=lockAccessory.getServiceById(Service.Switch, message.mid)}
					if(this.showBattery){batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)}
					if(this.showSensor){sensorService=lockAccessory.getServiceById(Service.HumiditySensor, message.mid)}
					if(this.showControls==(4||5)){controlService=lockAccessory.getServiceById(Service.Thermostat, message.mid)}

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
							if(this.showSensor){HumiditySensor.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(0)}
							break
						case 2://awating start
							this.log.info('%s paused, waiting to start',lockService.getCharacteristic(Characteristic.Name).value)
							lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
							//add delay
							break
						case 3://charging
							this.log.info('%s charging',lockService.getCharacteristic(Characteristic.Name).value)
							if(this.showBattery){this.calcBattery(batteryService,sensorService)}
							break
						case 4://complete
							this.log.info('%s complete, %s% charge added',lockService.getCharacteristic(Characteristic.Name).value,batteryService.getCharacteristic(Characteristic.BatteryLevel).value)
								if(this.showBattery){clearInterval(this.endTime[batteryService.subtype])}
								if(this.showBattery){clearInterval(this.endTime[sensorService.subtype])}
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
					this.log.info('%s %s updated to %s', message.mid, messageText, value)
					if(this.showBattery){batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)}
					if(this.showControls==(1||2||3)){activeService=lockAccessory.getServiceById(Service.Switch, message.mid)}
					if(this.showControls==(4||5)){activeService=lockAccessory.getServiceById(Service.Thermostat, message.mid)}
					if(value>0){
						if(this.showBattery){batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(true)}
						if(this.showControls==(1||2||3)){activeService.getCharacteristic(Characteristic.On).updateValue(true)}
						if(this.showControls==(4||5)){
							if(this.platform.useFahrenheit){
								this.log.warn(value)
								value=Math.round((value-32)*5/9)
								this.log.warn(value)
								}
							activeService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(true)
							activeService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(true)
							activeService.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
							activeService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(value)
							}
						if(this.showEqualizer && !this.experimental){
							this.log.info('%s %s updated to %s for equalizer max allocation current %s', message.mid, messageText, value, this.eq)
							windowService=windowAccessory.getServiceById(Service.WindowCovering, this.eq)
							this.updateEq(windowService,this.eq)
						}
					}
					else{
						if(this.showBattery){batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(false)}
						if(this.showControls==(1||2||3)){activeService.getCharacteristic(Characteristic.On).updateValue(false)}
						if(this.showControls==(4||5)){
							activeService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(false)
							activeService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(false)
							}
					}
					this.log.debug('%s output current updated',activeService.getCharacteristic(Characteristic.Name).value)
					break
				case 230://EqAvailableCurrentP1
				case 231://EqAvailableCurrentP2
				case 232://EqAvailableCurrentP3
					if(this.showEqualizer && this.experimental){
						this.log.debug('%s %s updated to %s for equalizer max circuit current %s', message.mid, messageText, value, this.eq)
						windowService=windowAccessory.getServiceById(Service.WindowCovering, this.eq)
						this.updateEq(windowService,this.eq)
					}

				break
		}
	}
}

module.exports=easeePlatform