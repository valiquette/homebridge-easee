'use strict'
let easeeAPI=require('./easeeapi')
//let easeeAPI=require('./testeaseeapi')
let lockMechanism=require('./devices/lock')
let battery=require('./devices/battery')
let basicSwitch=require('./devices/switch')
let basicOutlet=require('./devices/outlet')
let light=require('./devices/light')
let equalizer=require('./devices/equalizer')
let sensor=require('./devices/sensor')
let control=require('./devices/control')
let enumeration=require('./enumerations')
let observations=require('./observations')

class easeePlatform {
	constructor(log, config, api){
	this.easeeapi=new easeeAPI(this, log, config)
	this.lockMechanism=new lockMechanism(this, log)
	this.battery=new battery(this, log)
	this.basicSwitch=new basicSwitch(this, log)
	this.basicOutlet=new basicOutlet(this, log)
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
	this.retryMax=config.retryMax || 3 //attempts
	this.retryAttempt=0
	this.showBattery=config.showBattery
	this.showControls=config.showControls
	this.useOutlet=config.useOutlet ? config.useOutlet : false
	this.showLight=config.showLight
	this.showReboot=config.showReboot
	this.showOverride=config.showOverride
	this.showAPIMessages=config.showAPIMessages ? config.showAPIMessages : false
	this.showSignalRMessages=config.showSignalRMessages ? config.showSignalRMessages : false
	this.showSensor=config.socSensor ? config.socSensor : false
	this.showEqualizer=config.showEqualizer ? config.showEqualizer : false
	this.experimental=config.experimental ? config.experimental : false
	this.useFahrenheit=config.useFahrenheit ? config.useFahrenheit : true
	this.eq
	this.eqMin=this.config.eqMin || 15
	this.eqMax=this.config.eqMax || 100
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
	if(this.useOutlet && (this.showControls==1 || this.showControls==2 || this.showControls==3)){
		this.showControls=this.showControls*10
	}
	if(config.cars){this.showBattery=true}
	if(!config.username || !config.password){
	this.log.error('Valid username and password are required in order to communicate with easee, please check the plugin config.')
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

	identify(){
		this.log.info('Identify easee!')
	}

	async getDevices(){
		try{
			this.log.debug('Fetching Build info...')
			this.log.info('Getting Account info...')
			//get new observation list
			this.observations.items=await this.easeeapi.getObservations().catch(err=>{this.log.error('Failed to get observation list for build. \n%s', err)})
			this.log.debug('Retrieved %s observations',observations.items.length)
			// login to the API and get the token
			let login=await this.easeeapi.login(this.username,this.password).catch(err=>{this.log.error('Failed to get login for build. \n%s', err)})
			this.log.debug('Found token %s********************%s', login.accessToken.substring(0,50),login.accessToken.substring((login.accessToken).length-50))
			this.log.debug('Expires in %s hours',login.expiresIn/60/60)
			this.log.debug('Found Refresh Token %s********************%s', login.refreshToken.substring(0,10),login.refreshToken.substring((login.refreshToken).length-10))
			this.token=login.accessToken
			this.refreshToken=login.refreshToken
			this.setTokenRefresh(login.expiresIn)
			//get profile
			let profile=await	this.easeeapi.profile(this.token).catch(err=>{this.log.error('Failed to get profile for build. \n%s', err)})
			this.log.info('Found account for %s %s', profile.firstName, profile.lastName)
			this.userId=profile.userId
			//get product
			let products=await this.easeeapi.products(this.token,this.userId).catch(err=>{this.log.error('Failed to get products for build. \n%s', err)})
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
						let chargerConfig=await this.easeeapi.chargerConfig(this.token,charger.id).catch(err=>{this.log.error('Failed to get charger config info for build. \n%s', err)})
						let chargerState=await this.easeeapi.chargerState(this.token,charger.id).catch(err=>{this.log.error('Failed to get charger state for build. \n%s', err)})
						let chargerDetails=await this.easeeapi.chargerDetails(this.token,charger.id).catch(err=>{this.log.error('Failed to get charger detail info for build. \n%s', err)})
						this.log.debug('Phase mode = %s', this.enumeration.data.PhaseMode[chargerConfig.phaseMode])
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
						let outletService
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
							this.control.configureControlService(charger, controlService)
							lockAccessory.getService(Service.LockMechanism).addLinkedService(controlService)
							lockAccessory.addService(controlService)
						}
						if(this.showControls==10){
							outletService=this.basicOutlet.createOutletService(charger, chargerState,'Toggle')
							this.basicOutlet.configureOutletService(charger, outletService)
							lockAccessory.getService(Service.LockMechanism).addLinkedService(outletService)
							lockAccessory.addService(outletService)
						}
						if(this.showControls==20){
							outletService=this.basicOutlet.createOutletService(charger, chargerState,'Start/Stop')
							this.basicOutlet.configureOutletService(charger, outletService)
							lockAccessory.getService(Service.LockMechanism).addLinkedService(outletService)
							lockAccessory.addService(outletService)
						}
						if(this.showControls==30){
							outletService=this.basicOutlet.createOutletService(charger, chargerState,'Pause/Resume')
							this.basicOutlet.configureOutletService(charger, outletService)
							lockAccessory.getService(Service.LockMechanism).addLinkedService(outletService)
							lockAccessory.addService(outletService)
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
						/*
						let currentSession=await this.easeeapi.currentSession(this.token,charger.id).catch(err=>{this.log.error('Failed to get current session. \n%s', err)})
						if(currentSession.status==200){
							this.log.debug('Charge session ongoing')
							this.updateService({"mid":"EHEWWVHU","dataType":4,"id":109,"timestamp":new Date(Date.now()).toISOString(),"value":"3"})
							this.updateService({"mid":"EHEWWVHU","dataType":4,"id":114,"timestamp":new Date(Date.now()).toISOString(),"value":"32"})
						}
						*/
						this.easeeapi.signalR(this.token, charger.id)
						this.resetSignalR(login.expiresIn, charger)
					})
				})
				try{
					if(this.showEqualizer && location.equalizers[0]){
						this.eq=location.equalizers[0].id
						let equalizerConfig=await this.easeeapi.equalizerConfig(this.token,location.equalizers[0].id).catch(err=>{this.log.error('Failed to get equalizer config info for build. \n%s', err)})
						let equalizerState=await this.easeeapi.equalizerState(this.token,location.equalizers[0].id).catch(err=>{this.log.error('Failed to get equalizer state for build. \n%s', err)})
						let equalizerDetails=await this.easeeapi.equalizerDetails(this.token,location.equalizers[0].id).catch(err=>{this.log.error('Failed to get equalizer detail info for build. \n%s', err)})
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
						if(location.equalizers[0]){
							let uuid2=UUIDGen.generate(location.equalizers[0].id)
							if(this.accessories[uuid2]){
								this.log.info('Removed accessory %s', location.equalizers[0].name)
								this.api.unregisterPlatformAccessories(PluginName, PlatformName, [this.accessories[uuid2]])
								delete this.accessories[uuid2]
							}
						}
						if(this.showEqualizer)this.log.info('No Equalizer found')
					}
				}catch(err){this.log.warn('Failed to add Equalizer')}
			})
			setTimeout(()=>{this.log.info('Easee Platform finished loading')}, 5000)
		}catch(err){
			if(this.retryAttempt<this.retryMax){
				this.retryAttempt++
				this.log.error('Failed to get devices. Retry attempt %s of %s in %s seconds...',this.retryAttempt, this.retryMax, this.retryWait)
				setTimeout(async()=>{
					this.getDevices()
				},this.retryWait*1000)
			}
			else{
				this.log.error('Failed to get devices...\n%s', err)
			}
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
				let tokenInfo=await this.easeeapi.refreshToken(this.token,this.refreshToken).catch(err=>{this.log.error('Failed signin to refresh token. \n%s', err)})
				this.log.debug('new token %s**********%s', tokenInfo.accessToken.substring(0,50),tokenInfo.accessToken.substring((tokenInfo.accessToken).length-50))
				this.log.debug('new Refresh Token %s**********%s', tokenInfo.refreshToken.substring(0,10),tokenInfo.refreshToken.substring((tokenInfo.refreshToken).length-10))
				this.token=tokenInfo.accessToken
				this.refreshToken=tokenInfo.refreshToken
				this.log.info('Token has been refreshed')
				this.log.debug(JSON.stringify(tokenInfo,null,2))
			}catch(err){this.log.error('Failed to refresh token. \n%s', err)}
		},ttl*1000/1.2) //~20 hours
	}

	resetSignalR(ttl,charger){
		setInterval(()=>{
			try{
				this.easeeapi.signalR(this.token,charger.id)
				this.log.info('SignalR has been reset')
			}catch(err){this.log.error('Failed to reset SignalR. \n%s', err)}
		},ttl*1000/1.2)
	}

	async calcBattery(chargerId, batteryService, sensorService){
		try {
			if(this.cars){
				let car=this.cars.filter(charger=>(charger.chargerName.includes(batteryService.getCharacteristic(Characteristic.Name).value)))
				this.batterySize=car[0].kwH
			}
			else{
				this.batterySize=80
			}
			if(this.showBattery){
				if(this.amps[batteryService.subtype]){
					this.amperage=this.amps[batteryService.subtype]
				}
				clearInterval(this.endTime[batteryService.subtype])
			}
			if(this.showSensor){
				if(this.amps[sensorService.subtype]){
					this.amperage=this.amps[sensorService.subtype]
				}
				clearInterval(this.endTime[sensorService.subtype])
			}

			let kwh=this.voltage*this.amperage/1000
			let fullCharge=(this.batterySize)/(kwh)
			let x=new Date(0,0)
			x.setSeconds(fullCharge*60*60)
			let fullChargeTime=x.toTimeString().slice(0,8)
			this.log.info('Charging time for 100% charge ',fullChargeTime)
			let currentSession=await this.easeeapi.currentSession(this.token,chargerId).catch(err=>{this.log.error('Failed to get current session. \n%s', err)})
			//this.log.debug(currentSession.status)
			if(currentSession.status==404){
				this.log.debug(currentSession.data.title)
				this.log.debug('Charge session complete')
				return
			}
			else{
				let startTime=Date.parse(currentSession.data.sessionStart)
				let runningTime=currentSession.data.chargeDurationInSeconds
				let chargeAdded=currentSession.data.sessionEnergy
				let percentAdded=(chargeAdded/this.batterySize*100).toFixed(0)
				this.log.debug('Charge added %s kwh, %s%',chargeAdded,percentAdded)

				let endTime=setInterval(async()=>{
					try{
						let currentSession=await this.easeeapi.currentSession(this.token,chargerId).catch(err=>{this.log.error('Failed to get current session. \n%s', err)})
						//this.log.debug(currentSession.status)
						if(currentSession.status==200){
							runningTime=currentSession.data.chargeDurationInSeconds
							chargeAdded=currentSession.data.sessionEnergy
							percentAdded=(chargeAdded/this.batterySize*100).toFixed(0)
							this.log.debug('Charge added %s kwh, %s%',chargeAdded,percentAdded)
							if(this.showBattery){
								batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(percentAdded)
							}
							if(this.showSensor){
								sensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(percentAdded)
							}
							if(percentAdded>100){
								clearInterval(endTime)
							}
						}
						else if(currentSession.status==404){
							this.log.debug(currentSession.data.title)
							this.log.debug('Charge session complete')
							clearInterval(endTime)
						}
					}catch(err){this.log.error('Failed. \n%s', err)}
				},5*60*1000)
				if(this.showBattery){
					this.endTime[batteryService.subtype]=endTime
				}
				if(this.showSensor){
					this.endTime[sensorService.subtype]=endTime
				}
			}
		}catch(err){
			this.log.error('Failed to update battery. \n%s',err)
		}
	}

	async updateEq(windowService,eqId){
		try{
			let equalizerConfig=await this.easeeapi.equalizerConfig(this.token,eqId).catch(err=>{this.log.error('Failed to get comfig info for build. \n%s', err)})
			if(equalizerConfig){
				let percent=Math.round(equalizerConfig.siteStructure.maxAllocatedCurrent/equalizerConfig.siteStructure.ratedCurrent*100)
				if(this.experimental){
					percent=Math.round(equalizerConfig.siteStructure.maxContinuousCurrent/equalizerConfig.siteStructure.ratedCurrent*100)
				}
				if(this.eqMin>this.eqMax){
					this.log.warn('Equalizer min-max values are inverted, will use default 15-100. Check your config.')
					this.eqMin=15
					this.eqMax=100
				}
				if(percent>this.eqMax){
					this.log.warn('Limit %s out of range, will use max value. Check high limits in config.', percent)
					percent=this.eqMax
				}
				if(percent<this.eqMin){
					this.log.warn('Limit %s out of range, will use min value. Check low limits in config.', percent)
					percent=this.eqMin
				}
				this.log.debug('updating equalizer %s with new value %s%',eqId, percent)
				windowService.getCharacteristic(Characteristic.TargetPosition).updateValue(percent)
				windowService.getCharacteristic(Characteristic.CurrentPosition).updateValue(percent)
			}
		}catch(err){this.log.error('Failed to update equalizer. \n%s', err)}
	}

	updateService(message){
		let messageText=this.observations.items.filter(result=>result.observationId == message.id)[0].name
		this.log.debug('%s %s(%s)=%s', message.mid, messageText, message.id, message.value)
		let uuid=UUIDGen.generate(message.mid)
		let lockAccessory=this.accessories[uuid]
		if(this.showEqualizer){
			let uuid2=UUIDGen.generate(this.eq)
			let windowAccessory=this.accessories[uuid2]
		}
		let activeService
		let lockService
		let windowService
		let batteryService
		let sensorService
		let value
		let valueText

		switch(message.dataType){
			case 1: {value=parseInt(message.value); break}
			case 2: {if(parseInt(message.value)==1 || message.value=='True'){value=true} else{value=false}; break}
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
				this.log.info('%s %s updated to %s', message.mid, messageText, value)
				if(this.showBattery){
					batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)
					this.amps[batteryService.subtype]=value
				}
				if(this.showSensor){
					sensorService=lockAccessory.getServiceById(Service.HumiditySensor, message.mid)
					this.amps[sensorService.subtype]=value
				}
				break
			case 48://state_dynamicChargerCurrent
				this.log.info('%s %s updated to %s', message.mid, messageText, value)
				if(value>0){
					if(this.showBattery){
						batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)
						this.amps[batteryService.subtype]=value
					}
					if(this.showSensor){
						sensorService=lockAccessory.getServiceById(Service.HumiditySensor, message.mid)
						this.amps[sensorService.subtype]=value
					}
					if(this.showControls==4){
						if(this.useFahrenheit){value=((value-32)*5/9).toFixed(1)}
						activeService=lockAccessory.getServiceById(Service.Thermostat, message.mid)
						activeService.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
						activeService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(value)
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
				if(this.showControls==1 || this.showControls==2 || this.showControls==3){activeService=lockAccessory.getServiceById(Service.Switch, message.mid)}
				if(this.showControls==10 || this.showControls==20|this.showControls==30){activeService=lockAccessory.getServiceById(Service.Outlet, message.mid)}
				if(this.showControls==4){activeService=lockAccessory.getServiceById(Service.Thermostat, message.mid)}
				if(this.showBattery){batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)}
				if(this.showSensor){sensorService=lockAccessory.getServiceById(Service.HumiditySensor, message.mid)}
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
						if(this.showBattery){
							clearInterval(this.endTime[batteryService.subtype])
							batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(0)
						}
						if(this.showSensor){
							clearInterval(this.endTime[sensorService.subtype])
							HumiditySensor.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(0)
						}
						break
					case 2://awating start
						this.log.info('%s paused, waiting to start',lockService.getCharacteristic(Characteristic.Name).value)
						lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
						if(this.showBattery){clearInterval(this.endTime[batteryService.subtype])}
						if(this.showSensor){clearInterval(this.endTime[sensorService.subtype])}
						if(this.showControls==1 || this.showControls==2 || this.showControls==3){activeService.getCharacteristic(Characteristic.On).updateValue(false)}
						if(this.showControls==10 || this.showControls==20 || this.showControls==30){activeService.getCharacteristic(Characteristic.On).updateValue(false)}
						break
					case 3://charging
						this.log.info('%s charging',lockService.getCharacteristic(Characteristic.Name).value)
						lockService.getCharacteristic(Characteristic.OutletInUse).updateValue(true)
						if(this.showBattery || this.showSensor){this.calcBattery(message.mid,batteryService,sensorService)}
						if(this.showControls==1 || this.showControls==2 || this.showControls==3){activeService.getCharacteristic(Characteristic.On).updateValue(true)}
						if(this.showControls==10 || this.showControls==20 || this.showControls==30){activeService.getCharacteristic(Characteristic.On).updateValue(true)}
						break
					case 4://complete
						this.log.info('%s complete, %s% charge added',lockService.getCharacteristic(Characteristic.Name).value,batteryService.getCharacteristic(Characteristic.BatteryLevel).value)
							if(this.showBattery){clearInterval(this.endTime[batteryService.subtype])}
							if(this.showSensor){clearInterval(this.endTime[sensorService.subtype])}
							if(this.showBattery){batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(false)}
							if(this.showControls==1 || this.showControls==2 || this.showControls==3){activeService.getCharacteristic(Characteristic.On).updateValue(false)}
							if(this.showControls==10 || this.showControls==20 || this.showControls==30){activeService.getCharacteristic(Characteristic.On).updateValue(false)}
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
				if(this.showControls==1 || this.showControls==2 || this.showControls==3){activeService=lockAccessory.getServiceById(Service.Switch, message.mid)}
				if(this.showControls==10 || this.showControls==20 || this.showControls==30){activeService=lockAccessory.getServiceById(Service.Outlet, message.mid)}
				if(this.showControls==4){activeService=lockAccessory.getServiceById(Service.Thermostat, message.mid)}
				if(this.showBattery){batteryService=lockAccessory.getServiceById(Service.Battery, message.mid)}
				if(this.showSensor){sensorService=lockAccessory.getServiceById(Service.HumiditySensor, message.mid)}
				if(value>0){
					if(this.showBattery){batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(true)}
					//if(this.showControls==1 || this.showControls==2 || this.showControls==3){activeService.getCharacteristic(Characteristic.On).updateValue(true)}
					//if(this.showControls==10 || this.showControls==20 || this.showControls==30){activeService.getCharacteristic(Characteristic.On).updateValue(true)}
					if(this.showControls==4){
						activeService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(true)
						activeService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(true)
						if(this.useFahrenheit){value=((value-32)*5/9).toFixed(1)}
							activeService.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
							activeService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(value)
						}
					if(this.showEqualizer && !this.experimental){
						this.log.info('%s %s updated to %s for equalizer max allocation current %s', message.mid, messageText, value, this.eq)
						windowService=windowAccessory.getServiceById(Service.WindowCovering, this.eq)
						this.updateEq(windowService,this.eq)
					}
				}
				else if(value==0){
					if(this.showBattery){batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(false)}
					//if(this.showControls==1 || this.showControls==2 || this.showControls==3){activeService.getCharacteristic(Characteristic.On).updateValue(false)}
					//if(this.showControls==10 || this.showControls==20 || this.showControls==30){activeService.getCharacteristic(Characteristic.On).updateValue(false)}
					if(this.showControls==4){
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