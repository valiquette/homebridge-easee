'use strict'
let easeeAPI=require('./easeeapi')
let easeeTestAPI=require('./easeeapitest')
let lockMechanism=require('./devices/lock')

class easeePlatform {

  constructor(log, config, api){
    //this.easeeapi=new easeeAPI(this,log)
		this.lockMechanism=new lockMechanism(this,log,config)

    this.log=log
    this.config=config
		if (config.test){
			this.easeeapi=new easeeTestAPI(this,log)}
		else {
			this.easeeapi=new easeeAPI(this,log)}
    this.username=config.username
    this.password=config.password
    this.token
		this.refreshToken
		this.rate=config.rate
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
							this.easeeapi.state(this.token,charger.id).then(response=>{
								let chargerState=response.data
								this.easeeapi.chargerDetails(this.token,charger.id).then(response=>{
									let chargerDetails=response.data
									let uuid=UUIDGen.generate(charger.id)							
									if(this.accessories[uuid]){
										this.api.unregisterPlatformAccessories(PluginName, PlatformName, [this.accessories[uuid]])
										delete this.accessories[uuid]
									}
									let lockAccessory=this.lockMechanism.createLockAccessory(charger,chargerDetails,chargerState,uuid)
									let lockService=this.lockMechanism.createLockService(charger,chargerDetails)
									this.lockMechanism.configureLockService(lockService,false) //chargerDetails.locked)
									lockAccessory.addService(lockService)
									this.accessories[uuid]=lockAccessory                     
									this.log.info('Adding Lock for %s charger ', charger.name)
									this.log.debug('Registering platform accessory')
									this.api.registerPlatformAccessories(PluginName, PlatformName, [lockAccessory])
									this.setChargerRefresh(lockService,charger.id)
									this.updateStatus(lockService, 'lock',false) //chargerDetails.statusDescription)
									this.updateStatus(lockService, 'network',true) //chargerDetails.statusDescription)
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

		setChargerRefresh(lockService,id){
			// Refresh charger status
				setInterval(()=>{		
					try{		
						this.easeeapi.getConfig(this.token,id).then(response=>{
							this.log.debug('refreshed charger %s',id)
							this.log.debug('Charger Authorization Required %S',response.data.authorizationRequired)
							this.updateStatus(lockService,"lock",response.data.authorizationRequired)
						}).catch(err=>{this.log.error('Failed to refresh charger', err)})
					}catch(err){this.log.error('Failed to refresh charger', err)}	
				}, this.rate*60*1000)
				
				setInterval(()=>{		
					try{		
						this.easeeapi.state(this.token,id).then(response=>{
							this.log.debug('refreshed charger %s',id)
							this.log.debug('Charger Online %S',response.data.isOnline)
							this.updateStatus(lockService,"network",response.data.isOnline)
						}).catch(err=>{this.log.error('Failed to refresh charger', err)})
					}catch(err){this.log.error('Failed to refresh charger', err)}	
				}, this.rate*60*1000)
			}

		updateStatus(lockService,type,status){
			switch (type){
				case 'lock':
					switch(status){
						case false:
							//lockService.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.NO_FAULT)
							lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(Characteristic.LockTargetState.UNSECURED)
							lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(Characteristic.LockTargetState.UNSECURED)
							break
						case true:
							//lockService.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.NO_FAULT)
							lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(Characteristic.LockTargetState.SECURED)
							lockService.getCharacteristic(Characteristic.LockTargetState).updateValue(Characteristic.LockTargetState.SECURED)
						break
						default:
							this.log.warn('Unknown lock message received: %s',status)
						break	
					}
				break	
				case 'network':
					switch(status){
						case true:
							lockService.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.NO_FAULT)
							break
						case false:
						this.log.warn('%s disconnected at %s! This will show as non-responding in Homekit until the connection is restored.',chargerData.name, new Date(chargerData.lastConnection).toLocaleString())
						lockService.setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.GENERAL_FAULT)
						break
						default:
							this.log.warn('Unknown network message received: %s',status)
						break	
					}
				break
				default:
					this.log.warn('Unknown message received: %s',status)
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