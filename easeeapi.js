/* 
Public API info https://developer.easee.cloud/docs
https://www.notion.so/easee/Developer-documentation-96beaa49e5a64d5fa18d9c801a7dfc28
https =//www.notion.so/Charger-template-c6a20ff7cfea41e2b5f80b00afb34af5
Enumerations
https://www.notion.so/Enumerations-c7fed34ae1ce4d7384d522868f5a0139
*/

let axios = require('axios')
let signalr = require('@microsoft/signalr')
 
let endpoint = 'https://api.easee.cloud/api'
//let streamingEndpoint = 'https://api.beta.easee.cloud'
let streamingEndpoint = 'https://api.easee.cloud' 

function easeeAPI (platform,log){
	this.log=log
	this.platform=platform
}

easeeAPI.prototype={

	login: async function(userName,password){
		try {  
			this.log.debug('Retrieving token')
			let response = await axios({
				method: 'post',
				url: `${endpoint}/accounts/login`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
					},
				data:{
					'userName':userName,
					'password':password
				},
				responseType: 'json'
			}).catch(err=>{this.log.error('Error getting token %s', JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('login response',JSON.stringify(response.data,null,2))}
			return  response
		}catch(err) {this.log.error('Error retrieving token %s', err)}
	},

	refreshToken: async function(accessToken,refreshToken){
		try {  
			this.log.debug('Refreshing token')
			let response = await axios({
				method: 'post',
				url: `${endpoint}/accounts/refresh_token`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data:{
					'accessToken':accessToken,
					'refreshToken':refreshToken
				},
				responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s refresing token %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('refresh response',JSON.stringify(response.data,null,2))}
			return  response
		}catch(err) {this.log.error('Error refreshing token %s', err)}
	},
	
	profile: async function(token){
		try {  
			this.log.debug('Retrieving user profile')
			let response = await axios({
				method: 'get',
				url: `${endpoint}/accounts/profile`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Bearer '+token
				},
				responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting user profile %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('get user response',JSON.stringify(response.data,null,2))}		
			return response
		}catch(err) {this.log.error('Error retrieving user profile %s', err)}
	},

	products: async function(token,userId){
		//is userID needed
		try {  
				this.log.debug('Retrieving products info')
				let response = await axios({
						method: 'get',
						url: `${endpoint}/accounts/products`,
						headers: {
              'Accept': 'application/json',
							'Content-Type': 'application/json',
							'Authorization': 'Bearer '+token
						},
						responseType: 'json'
				}).catch(err=>{this.log.error('Error %s-%s getting products %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
				if(response){	this.log.debug('get products data response',JSON.stringify(response.data,null,2))}	
				return response
			}catch(err) {this.log.error('Error retrieving products %s', err)}
		},

	site: async function(token,chargerId){
		try {  
				this.log.debug('Retrieving site info %s',chargerId)
				let response = await axios({
						method: 'get',
						url: `${endpoint}/chargers/${chargerId}/${site}`,
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'Authorization': 'Bearer '+token
						},
						responseType: 'json'
				}).catch(err=>{this.log.error('Error getting site %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
				if(response){this.log.debug('get site data response',JSON.stringify(response.data,null,2))}
				return response
			}catch(err) {this.log.error('Error site products %s', err)}
		},	
	
	chargers: async function(token){
		try {  
			this.log.debug('Retrieving chargers')
			let response = await axios({
					method: 'get',
					url: `${endpoint}/chargers`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting chargers %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response){	this.log.debug('get chargers config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving chargers %s', err)}
	},

	charger: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger info %s',chargerId)
			let response = await axios({
					method: 'get',
					url: `${endpoint}/chargers/${chargerId}`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger info %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('get charger info config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger info %s', err)}
	},

	chargerDetails: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger details %s',chargerId)
			let response = await axios({
					method: 'get',
					url: `${endpoint}/chargers/${chargerId}/details`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger details %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('get charger details config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger details %s', err)}
	},

	state: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger state %s',chargerId)
			let response = await axios({
					method: 'get',
					url: `${endpoint}/chargers/${chargerId}/state`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger state %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('get charger state config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger state %s', err)}
	},

	getConfig: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger config %s',chargerId)
			let response = await axios({
					method: 'get',
					url: `${endpoint}/chargers/${chargerId}/config`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger config %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response){	this.log.debug('get charger config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger config %s', err)}
	},

	lock: async function(token,chargerId,value){
		//change charger settings
		this.log.debug('Setting charger lock state for %s to %s', chargerId, value)
		let response = await axios({
				method: 'post',
				url: `${endpoint}/chargers/${chargerId}/settings`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Bearer '+token
				},
				data:{
					'authorizationRequired':value
				},
				responseType: 'json'
			}).catch(err=>{
				this.log.debug('Error posting lock command  %s', err.message)
				this.log.debug('Error posting lock command  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
		if(response.status==200 || response.status==202){this.log.debug('post lock response',JSON.stringify(response.data,null,2))}
		return response
	},

	light: async function(token,chargerId,value){
		//change charger settings
		this.log.debug('Setting LED light for %s to %s',chargerId,value)
		let response = await axios({
				method: 'post',
				url: `${endpoint}/chargers/${chargerId}/settings`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Bearer '+token
				},
				data:{
					'ledStripBrightness':value
				},
				responseType: 'json'
			}).catch(err=>{
				this.log.debug('Error posting light command  %s', err.message)
				this.log.debug('Error posting light command  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
		if(response.status==200 || response.status==202){this.log.debug('post light response',JSON.stringify(response.data,null,2))}
		return response
	},

	command: async function(token,chargerId,command){ 
		this.log.debug('%s for %s',command, chargerId)
		let response = await axios({
				method: 'post',
				url: `${endpoint}/chargers/${chargerId}/commands/${command}`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Bearer '+token
				},
				responseType: 'json'
		}).catch(err=>{
			this.log.debug('Error posting %s command  %s', command, err.message)
			this.log.debug('Error posting %s command  %s', command, err.response.config.header, err.response.config.method, err.response.config.url)
			return err.response
		})
		if(response.status==200 || response.status==202){this.log.debug('post %s response',command, JSON.stringify(response.data,null,2))}
		return response
	},

	getObservations: async function(token){
		try {  
			this.log.debug('Retrieving observations')
			let response = await axios({
					method: 'get',
					url: `${endpoint}/resources/observation_properties`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s observations %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			//if(response){	this.log.debug('get observations response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving observations %s', err)}
	},

	overrideSchedule: async function(token,chargerId){
		try {  
			this.log.debug('Override schedule')
			let response = await axios({
					method: 'post',
					url: `${endpoint}/chargers/${chargerId}/commands/override_schedule`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
				}).catch(err=>{
					this.log.debug('Error posting override  %s', err.message)
					this.log.debug('Error posting override  %s', err.response.config.header, err.response.config.method, err.response.config.url)
					return err.response
				})
				if(response.status==200 || response.status==202){this.log.debug('post response', JSON.stringify(response.data,null,2))}
				return response
		}catch(err) {this.log.error('Error setting override %s', err)}
	},

	setDelay: async function(token,chargerId){
		try {  
			this.log.debug('Delay start')
			let response = await axios({
					method: 'post',
					url: `${endpoint}/chargers/${chargerId}/commands/override_schedule`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					data:{
						"chargingCurrentLimit": 32,
						"id": chargerId,
						"chargeStartTime": "18:00",
						"chargeStopTime": "",
						"repeat": false,
						"isEnabled": true
					},
					responseType: 'json'
				}).catch(err=>{
					this.log.debug('Error posting delay  %s', err.message)
					this.log.debug('Error posting delay  %s', err.response.config.header, err.response.config.method, err.response.config.url)
					return err.response
				})
				if(response.status==200 || response.status==202){this.log.debug('post response', JSON.stringify(response.data,null,2))}
				return response
		}catch(err) {this.log.error('Error setting delay %s', err)}
	},

	signalR: async function(token,chargerId){ 
		/*	
			Trace = 0	
			Log level for very low severity diagnostic messages.
			Debug = 1	
			Log level for low severity diagnostic messages.
			Information = 2	
			Log level for informational diagnostic messages.
			Warning = 3	
			Log level for diagnostic messages that indicate a non-fatal problem.
			Error = 4	
			Log level for diagnostic messages that indicate a failure in the current operation.
			Critical = 5	
			Log level for diagnostic messages that indicate a failure that will terminate the entire application.
			None = 6	
			The highest possible log level. Used when configuring logging to indicate that no log messages should be emitted.
		*/
		let connection = new signalr.HubConnectionBuilder()
			.withUrl(`${streamingEndpoint}/hubs/chargers`, {
				accessTokenFactory:()=>token
			})
			.withAutomaticReconnect()
			.configureLogging(signalr.LogLevel.None)
			.build()

		connection.start().then(()=>{
			connection.invoke('SubscribeWithCurrentState', chargerId, true)
			this.log.info('Starting connection')
		})
		connection.onclose(()=>{
			this.log.warn("Connection close...")
		})
		connection.onreconnected(()=>{
			connection.invoke('SubscribeWithCurrentState', chargerId, true)
			this.log.info("Reconnected...")
		})
		connection.onreconnecting(()=>{
			this.log.info("Reconnecting...")
		})
		connection.on('ProductUpdate', (productUpdate)=>{
			if(this.platform.showExtraDebugMessages){
				this.log.debug(JSON.stringify(productUpdate, null, null))
			}
			this.platform.updateService(productUpdate)
		})
		connection.on('ChargerUpdate', (chargerUpdate)=>{
			if(this.platform.showExtraDebugMessages){
				this.log.debug(JSON.stringify(chargerUpdate, null, 2))
			}
			//duplicate responses
			//this.platform.updateService(chargerUpdate)
		})
		
		connection.on('CommandResponse', (update)=>{
			if(this.platform.showExtraDebugMessages){
				this.log.debug(JSON.stringify(update, null, 2))
			}
			//if needed could process response here
		})
	}
}

module.exports = easeeAPI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        