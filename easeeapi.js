/*
Easee information
Public API info https://developer.easee.cloud/docs
SignalR examples https://developer.easee.cloud/page/signalr-code-examples
observations https://developer.easee.cloud/docs/observation-ids
Enumerations https://developer.easee.cloud/docs/enumerations
*/

let axios = require('axios')
let signalR = require('@microsoft/signalr')

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
			this.log.debug('Authenticating and retrieving access Token')
			let response = await axios({
				method: 'post',
				baseURL: endpoint,
				url: `/accounts/login`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'User-Agent': `${PluginName}/${PluginVersion}`
					},
				data: {
					'userName': userName,
					'password': password
				},
				responseType: 'json'
			}).catch(err=>{this.log.error('Error authenticating %s', JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('authentication response',JSON.stringify(response.data,null,2))}
			return  response
		}catch(err) {this.log.error('Error authenticating and retrieving token %s', err)}
	},

	refreshToken: async function(accessToken,refreshToken){
		try {
			this.log.debug('Refreshing access token')
			let response = await axios({
				method: 'post',
				baseURL: endpoint,
				url: `/accounts/refresh_token`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'User-Agent': `${PluginName}/${PluginVersion}`
				},
				data: {
					'accessToken': accessToken,
					'refreshToken': refreshToken
				},
				responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s refresing token %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('refresh response',JSON.stringify(response.data,null,2))}
			return  response
		}catch(err) {this.log.error('Error refreshing token %s', err)}
	},

	profile: async function(token){
		try {
			this.log.debug('Retrieving profile info of logged in account')
			let response = await axios({
				method: 'get',
				baseURL: endpoint,
				url: `/accounts/profile`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': `${PluginName}/${PluginVersion}`
				},
				responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting user profile info %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('get user response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving user profile info %s', err)}
	},

	products: async function(token,userId){
		//is userID needed
		try {
				this.log.debug('Retrieving products of logged in account')
				let response = await axios({
						method: 'get',
						baseURL: endpoint,
						url: `/accounts/products`,
						headers: {
              'Accept': 'application/json',
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`,
							'User-Agent': `${PluginName}/${PluginVersion}`
						},
						responseType: 'json'
				}).catch(err=>{this.log.error('Error %s-%s getting products %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
				if(response.status==200){	this.log.debug('get products data response',JSON.stringify(response.data,null,2))}
				return response
			}catch(err) {this.log.error('Error retrieving products %s', err)}
		},

	chargerSite: async function(token,chargerId){
		try {
				this.log.debug('Retrieving charger site info %s',chargerId)
				let response = await axios({
						method: 'get',
						baseURL: endpoint,
						url: `/chargers/${chargerId}/${site}`,
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`,
							'User-Agent': `${PluginName}/${PluginVersion}`
						},
						responseType: 'json'
				}).catch(err=>{this.log.error('Error getting site %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
				if(response.status==200){this.log.debug('get site data response',JSON.stringify(response.data,null,2))}
				return response
			}catch(err) {this.log.error('Error site products %s', err)}
		},

	chargers: async function(token){
		try {
			this.log.debug('Retrieving chargers')
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/chargers`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting chargers %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){	this.log.debug('get chargers config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving chargers %s', err)}
	},

	charger: async function(token,chargerId){
		try {
			this.log.debug('Retrieving specified charger info %s',chargerId)
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/chargers/${chargerId}`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger info %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('get charger info config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger info %s', err)}
	},

	chargerDetails: async function(token,chargerId){
		try {
			this.log.debug('Retrieving charger details %s',chargerId)
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/chargers/${chargerId}/details`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger details %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('get charger details config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger details %s', err)}
	},

	chargerState: async function(token,chargerId){
		try {
			this.log.debug('Retrieving charger state %s',chargerId)
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/chargers/${chargerId}/state`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger state %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('get charger state config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger state %s', err)}
	},

	chargerConfig: async function(token,chargerId){
		try {
			this.log.debug('Retrieving charger config %s',chargerId)
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/chargers/${chargerId}/config`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger config %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){	this.log.debug('get charger config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger config %s', err)}
	},

	equalizer: async function(token,equalizerId){
		try {
			this.log.debug('Retrieving specified equalizer info %s',equalizerId)
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/equalizers/${equalizerId}`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting charger info %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('get charger info config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger info %s', err)}
	},

	equalizerDetails: async function(token,equalizerId){
		try {
			this.log.debug('Retrieving equalizer details %s',equalizerId)
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/equalizers/${equalizerId}/details`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting equalizer details %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('get equalizer details config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving equalizer details %s', err)}
	},

	equalizerState: async function(token,equalizerId){
		try {
			this.log.debug('Retrieving equalizer state %s',equalizerId)
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/equalizers/${equalizerId}/state`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting equalizer state %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){this.log.debug('get equalizer state config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving equalizer state %s', err)}
	},

	equalizerConfig: async function(token,equalizerId){
		try {
			this.log.debug('Retrieving equalizer config %s',equalizerId)
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/equalizers/${equalizerId}/config`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s getting equalizer config %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			if(response.status==200){
				response.data.siteStructure=JSON.parse(response.data.siteStructure.replace(/(\r\n\t|\r\n|\r|\n|\t)/gm,'')) //removing CR LF and Tabs
				response.data.meterType=response.data.meterType.replace(/(\r\n\t|\r\n|\r|\n|\t)/gm,'') //removing CR LF and Tabs
				this.log.debug('get equalizer config response',JSON.stringify(response.data,null,2))
			}
			return response
		}catch(err) {this.log.error('Error retrieving equalizer config %s', err)}
	},

	configureEqualizerFuse: async function(token,eqId,fuseSize,value){ // unpublished API
		//change equalizer fuse settings
		this.log.debug('Setting Equalizer %s max continuous current to %s',eqId,value)
		let response = await axios({
				method: 'post',
				baseURL: endpoint,
				url: `equalizers/${eqId}/commands/configure_fuse`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': `${PluginName}/${PluginVersion}`
				},
				data: {
					'FuseSize': fuseSize,
					'MaxContinuousCurrent': value
				},
				responseType: 'json'
			}).catch(err=>{
				this.log.debug('Error posting fuse command  %s', err.message)
				this.log.debug('Error posting fuse command  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
		if(response.status==200 || response.status==202){this.log.debug('post fuse response',JSON.stringify(response.data,null,2))}
		return response
	},

	setMaxAllocatedCurrent: async function(token,eqId,value){
		//change equalizer settings
		this.log.debug('Setting Equalizer %s max allocated current to %s',eqId,value)
		let response = await axios({
				method: 'post',
				baseURL: endpoint,
				url: `equalizers/${eqId}/commands/configure_max_allocated_current`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': `${PluginName}/${PluginVersion}`
				},
				data: {
					'maxCurrent': value
				},
				responseType: 'json'
			}).catch(err=>{
				this.log.debug('Error posting max allocated %s', err.message)
				this.log.debug('Error posting max allocated %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
		if(response.status==200 || response.status==202){this.log.debug('post max allocated response',JSON.stringify(response.data,null,2))}
		return response
	},

	lock: async function(token,chargerId,value){
		//change charger settings
		this.log.debug('Setting charger lock state for %s to %s', chargerId, value)
		let response = await axios({
				method: 'post',
				baseURL: endpoint,
				url: `/chargers/${chargerId}/settings`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': `${PluginName}/${PluginVersion}`
				},
				data: {
					'authorizationRequired': value
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

	dynamicCurrent: async function(token,chargerId,value){
		//change charger settings
		this.log.debug('Setting Dynamic Current for %s to %s',chargerId,value)
		let response = await axios({
				method: 'post',
				baseURL: endpoint,
				url: `/chargers/${chargerId}/settings`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': `${PluginName}/${PluginVersion}`
				},
				data: {
					'dynamicChargerCurrent': value
				},
				responseType: 'json'
			}).catch(err=>{
				this.log.debug('Error posting dynamic current command  %s', err.message)
				this.log.debug('Error posting dynamic current command  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
		if(response.status==200 || response.status==202){this.log.debug('post dynamic current response',JSON.stringify(response.data,null,2))}
		return response
	},

	light: async function(token,chargerId,value){
		//change charger settings
		this.log.debug('Setting LED light for %s to %s',chargerId,value)
		let response = await axios({
				method: 'post',
				baseURL: endpoint,
				url: `/chargers/${chargerId}/settings`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': `${PluginName}/${PluginVersion}`
				},
				data: {
					'ledStripBrightness': value
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
				baseURL: endpoint,
				url: `/chargers/${chargerId}/commands/${command}`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': `${PluginName}/${PluginVersion}`
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

	getObservations: async function(){
		try {
			this.log.debug('Retrieving observations')
			let response = await axios({
					method: 'get',
					baseURL: endpoint,
					url: `/resources/observation_properties`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error %s-%s observations %s', err.response.status, err.response.statusText, JSON.stringify(err.config,null,2))})
			//if(response.status==200){this.log.debug('get observations response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving observations %s', err)}
	},

	overrideSchedule: async function(token,chargerId){
		try {
			this.log.debug('Override schedule')
			let response = await axios({
					method: 'post',
					baseURL: endpoint,
					url: `/chargers/${chargerId}/commands/override_schedule`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
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
					baseURL: endpoint,
					url: `/chargers/${chargerId}/commands/override_schedule`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'User-Agent': `${PluginName}/${PluginVersion}`
					},
					data: {
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
		/*	signlR logging
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
		let connection = new signalR.HubConnectionBuilder()
			//.withUrl(`${streamingEndpoint}/hubs/chargers`, {
			.withUrl(`${streamingEndpoint}/hubs/products`, {
				accessTokenFactory:()=>token
			})
			.configureLogging(signalR.LogLevel.None)
			.withAutomaticReconnect()
			.build()

		connection.start()
			.then(()=>{
				connection.invoke('SubscribeWithCurrentState', chargerId, true)
				this.log.info('Starting connection')
			}).catch((err) => {this.log.error('Error while starting connection: ', err)})

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
				this.log.debug('Product:',JSON.stringify(productUpdate, null, null))
			}
			//** full set of responses with a lot of extras
			this.platform.updateService(productUpdate)
		})
		connection.on('ChargerUpdate', (chargerUpdate)=>{
			if(this.platform.showExtraDebugMessages){
				this.log.debug('Charger:',JSON.stringify(chargerUpdate, null, null))
			}
			//** duplicate responses to product but fewer
			//this.platform.updateService(chargerUpdate)
		})
		connection.on('CommandResponse', (update)=>{
			if(this.platform.showExtraDebugMessages){
				this.log.debug('Command:',JSON.stringify(update, null, null))
			}
			//if needed could process response here vs api response
		})
	}
}

module.exports = easeeAPI