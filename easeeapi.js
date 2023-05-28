/*
Easee information
Public API info https://developer.easee.cloud/docs
SignalR examples https://developer.easee.cloud/page/signalr-code-examples
Observations https://developer.easee.cloud/docs/observation-ids
Enumerations https://developer.easee.cloud/docs/enumerations
*/

let axios = require('axios')
let rax = require('retry-axios') //v3.0.0 ES6 only
let signalR = require('@microsoft/signalr')

//let endpoint = 'https://api.easee.cloud/api' depracating Sep 2023
let endpoint = 'https://api.easee.com/api'
//let streamingEndpoint = 'https://api.easee.cloud' depracated
let streamingEndpoint = 'https://streams.easee.com'

class easeeAPI {
	constructor(platform, log, config) {
		this.log = log
		this.platform = platform
		this.config = config
		this.openConnection
		this.interceptorId = rax.attach()
	}

	async login(userName, password) {
		if (this.config.testToken) {
			return this.config.testToken
		}
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error authenticating. %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('authentication response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error authenticating and retrieving token \n%s', err)}
	}

	async refreshToken(accessToken, refreshToken) {
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
				responseType: 'json',
				raxConfig: {
					retry: 5,
					noResponseRetries: 2,
					retryDelay: 100,
					httpMethodsToRetry: ['GET', 'PUT'],
					statusCodesToRetry: [[100, 199], [400, 400], [401, 401], [404, 404], [500, 599]],
					backoffType: 'exponential',
					onRetryAttempt: err => {
						let cfg = rax.getConfig(err)
						this.log.warn(`${err.message} retrying refreshing token, attempt #${cfg.currentRetryAttempt}`)
					}
				}
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error refreshing token %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('refresh response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error refreshing token \n%s', err)}
	}

	async profile(token) {
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting user profile %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get user response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving user profile info. \n%s', err)}
	}
	async products(token, userId) {
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting products %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get products data response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving products. \n%s', err)}
	}

	async chargerSite(token, chargerId) {
		try {
			this.log.debug('Retrieving charger site info %s', chargerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting site info %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get site data response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error site products. \n%s', err)}
	}

	async chargers(token) {
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting chargers %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get chargers config response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving chargers. \n%s', err)}
	}
	async charger(token, chargerId) {
		try {
			this.log.debug('Retrieving specified charger info %s', chargerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting charger info %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get charger info config response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving charger info. \n%s', err)}
	}

	async chargerDetails(token, chargerId) {
		try {
			this.log.debug('Retrieving charger details %s', chargerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting charger details %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get charger details config response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving charger details. \n%s', err)}
	}

	async chargerState(token, chargerId) {
		try {
			this.log.debug('Retrieving charger state %s', chargerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting charger state %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get charger state config response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving charger state. \n%s', err)}
	}

	async chargerConfig(token, chargerId) {
		try {
			this.log.debug('Retrieving charger config %s', chargerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting charger config %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get charger config response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving charger config. \n%s', err)}
	}

	async currentSession(token, chargerId) {
		try {
			this.log.debug('Retrieving current session %s', chargerId)
			let response = await axios({
				method: 'get',
				baseURL: endpoint,
				url: `/chargers/${chargerId}/sessions/ongoing`,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': `${PluginName}/${PluginVersion}`
				},
				responseType: 'json',
				raxConfig: {
					retry: 3,
					noResponseRetries: 2,
					retryDelay: 100,
					httpMethodsToRetry: ['GET', 'PUT'],
					statusCodesToRetry: [[100, 199], [400, 400], [401, 401], [404, 404], [500, 599]],
					backoffType: 'exponential',
					onRetryAttempt: err => {
						let cfg = rax.getConfig(err)
						this.log.warn(`${err.message} retrying current session, attempt #${cfg.currentRetryAttempt}`)
					}
				}
			}).catch(err => {
				if (err.response.status == 404) {
					if (this.platform.showAPIMessages) { this.log.debug('no current session', err.response.data)}
					this.log.warn(JSON.stringify(err.response.data, null, 2))
					return err.response
				}
				else {
					this.log.debug(JSON.stringify(err, null, 2))
					this.log.error('Error getting current session %s', err.message)
					if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
					return err.response
				}
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get current session response', JSON.stringify(response.data, null, 2))}
				return response
			}
			return response
		} catch (err) { this.log.error('Error retrieving current session. \n%s', err)}
	}

	async equalizer(token, equalizerId) {
		try {
			this.log.debug('Retrieving specified equalizer info %s', equalizerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting equalizer info %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get equalizer info response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving equalizer info. \n%s', err)}
	}

	async equalizerDetails(token, equalizerId) {
		try {
			this.log.debug('Retrieving equalizer details %s', equalizerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting equalizer details %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get equalizer details config response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving equalizer details. \n%s', err)}
	}

	async equalizerState(token, equalizerId) {
		try {
			this.log.debug('Retrieving equalizer state %s', equalizerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting equalizer state %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				if (this.platform.showAPIMessages) { this.log.debug('get equalizer state config response', JSON.stringify(response.data, null, 2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving equalizer state. \n%s', err)}
	}

	async equalizerConfig(token, equalizerId) {
		try {
			this.log.debug('Retrieving equalizer config %s', equalizerId)
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting equalizer config %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				response.data.siteStructure = JSON.parse(response.data.siteStructure.replace(/(\r\n\t|\r\n|\r|\n|\t)/gm, '')) //removing CR LF and Tabs
				response.data.meterType = response.data.meterType.replace(/(\r\n\t|\r\n|\r|\n|\t)/gm, '') //removing CR LF and Tabs
				if (this.platform.showAPIMessages) {
					this.log.debug('get equalizer config response', JSON.stringify(response.data, null, 2))
				}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving equalizer config. \n%s', err)}
	}

	async getObservations() {
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
			}).catch(err => {
				this.log.debug(JSON.stringify(err, null, 2))
				this.log.error('Error getting observations %s', err.message)
				if (err.response) { this.log.warn(JSON.stringify(err.response.data, null, 2))}
				return err.response
			})
			if (response.status == 200) {
				//if(this.platform.showAPIMessages){this.log.debug('get observations response',JSON.stringify(response.data,null,2))}
				return response.data
			}
		} catch (err) { this.log.error('Error retrieving observations. \n%s', err)}
	}

	async configureEqualizerFuse(token, eqId, fuseSize, value) {
		try {
			//change equalizer fuse settings
			this.log.debug('Setting Equalizer %s max continuous current to %s', eqId, value)
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
			}).catch(err => {
				this.log.debug('Error posting fuse command  %s', err.message)
				this.log.debug('Error posting fuse command  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
			if ((response.status == 200 || response.status == 202) && this.platform.showAPIMessages) { this.log.debug('post fuse response', JSON.stringify(response.data, null, 2))}
			return response
		} catch (err) { this.log.error('Error configuring equalizer. \n%s', err)}
	}

	async setMaxAllocatedCurrent(token, eqId, value) {
		try {
			//change equalizer settings
			this.log.debug('Setting Equalizer %s max allocated current to %s', eqId, value)
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
			}).catch(err => {
				this.log.debug('Error posting max allocated %s', err.message)
				this.log.debug('Error posting max allocated %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
			if ((response.status == 200 || response.status == 202) && this.platform.showAPIMessages) { this.log.debug('post max allocated response', JSON.stringify(response.data, null, 2))}
			return response
		} catch (err) { this.log.error('Error setting equalizer. \n%s', err)}
	}

	async lock(token, chargerId, value) {
		try {
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
			}).catch(err => {
				this.log.debug('Error posting lock command  %s', err.message)
				this.log.debug('Error posting lock command  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
			if ((response.status == 200 || response.status == 202) && this.platform.showAPIMessages) { this.log.debug('post lock response', JSON.stringify(response.data, null, 2))}
			return response
		} catch (err) { this.log.error('Error setting lock. \n%s', err)}
	}

	async dynamicCurrent(token, chargerId, value) {
		try {
			//change charger settings
			this.log.debug('Setting Dynamic Current for %s to %s', chargerId, value)
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
			}).catch(err => {
				this.log.debug('Error posting dynamic current command  %s', err.message)
				this.log.debug('Error posting dynamic current command  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
			if ((response.status == 200 || response.status == 202) && this.platform.showAPIMessages) { this.log.debug('post dynamic current response', JSON.stringify(response.data, null, 2))}
			return response
		} catch (err) { this.log.error('Error setting dynamic current. \n%s', err)}
	}

	async light(token, chargerId, value) {
		try {
			//change charger settings
			this.log.debug('Setting LED light for %s to %s', chargerId, value)
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
			}).catch(err => {
				this.log.debug('Error posting light command  %s', err.message)
				this.log.debug('Error posting light command  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
			if ((response.status == 200 || response.status == 202) && this.platform.showAPIMessages) { this.log.debug('post light response', JSON.stringify(response.data, null, 2))}
			return response
		} catch (err) { this.log.error('Error setting light. \n%s', err)}
	}

	async command(token, chargerId, command) {
		try {
			this.log.debug('%s for %s', command, chargerId)
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
			}).catch(err => {
				this.log.debug('Error posting %s command  %s', command, err.message)
				this.log.debug('Error posting %s command  %s', command, err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
			if ((response.status == 200 || response.status == 202) && this.platform.showAPIMessages) { this.log.debug('post %s response', command, JSON.stringify(response.data, null, 2))}
			return response
		} catch (err) { this.log.error('Error excuting command. \n%s', err)}
	}

	async overrideSchedule(token, chargerId) {
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
			}).catch(err => {
				this.log.debug('Error posting override  %s', err.message)
				this.log.debug('Error posting override  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
			if ((response.status == 200 || response.status == 202) && this.platform.showAPIMessages) { this.log.debug('post response', JSON.stringify(response.data, null, 2))}
			return response
		} catch (err) { this.log.error('Error setting override. \n%s', err)}
	}

	async setDelay(token, chargerId) {
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
			}).catch(err => {
				this.log.debug('Error posting delay  %s', err.message)
				this.log.debug('Error posting delay  %s', err.response.config.header, err.response.config.method, err.response.config.url)
				return err.response
			})
			if ((response.status == 200 || response.status == 202) && this.platform.showAPIMessages) { this.log.debug('post response', JSON.stringify(response.data, null, 2))}
			return response
		} catch (err) { this.log.error('Error setting delay. \n%s', err)}
	}
	
	async signalR(token, chargerId) {
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
		if (this.openConnection) {
			this.log.debug('stopping open connection %s', this.openConnection.connectionId)
			this.openConnection.stop()
		}
		let connection = new signalR.HubConnectionBuilder()
			//.withUrl(`${streamingEndpoint}/hubs/chargers`, {
			.withUrl(`${streamingEndpoint}/hubs/products`, {
				//skipNegotiation: true,
				//transport: signalR.HttpTransportType.WebSockets,
				accessTokenFactory: () => token
			})
			.configureLogging(signalR.LogLevel.None) //change logging here if needed
			.withAutomaticReconnect()
			.build()
		connection.start()
			.then(() => {
				connection.invoke('SubscribeWithCurrentState', chargerId, true)
				this.log.info('Starting connection for live updates...')
				this.log.debug('signalR %s with id %s', connection.state, connection.connectionId)
				this.openConnection = connection
			}).catch((err) => {
				this.log.error('Error while starting connection: %s', err.message)
			})
		connection.onclose((error) => {
			this.log.warn('Connection closed', error.message)
		})
		connection.onreconnected(() => {
			connection.invoke('SubscribeWithCurrentState', chargerId, true)
			this.log.info('Reconnected to Connection id %s, updating current status', connection.connectionId)
		})
		connection.onreconnecting((error) => {
			this.log.info('Reconnecting...', error.message)
		})
		connection.on('ProductUpdate', (productUpdate) => {
			if (this.platform.showSignalRMessages) {
				this.log.debug('Connection %s Product: %s', connection.connectionId, JSON.stringify(productUpdate, null, null))
			}
			//** full set of responses with a lot of extras **
			this.platform.updateService(productUpdate)
		})
		connection.on('ChargerUpdate', (chargerUpdate) => {
			if (this.platform.showSignalRMessages) {
				this.log.debug('Connection %s Charger: %s', connection.connectionId, JSON.stringify(chargerUpdate, null, null))
			}
			//** duplicate responses to product but fewer **
			//this.platform.updateService(chargerUpdate)
		})
		connection.on('CommandResponse', (update) => {
			if (this.platform.showSignalRMessages) {
				this.log.debug('Command:', JSON.stringify(update, null, null))
			}
			//if needed could process response here vs api response
		})
	}
}
module.exports = easeeAPI