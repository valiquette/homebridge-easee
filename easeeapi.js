// Public API info https://developer.easee.cloud/docs

let axios = require('axios')
 
let endpoint = 'https://api.easee.cloud/api/'

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
				url: endpoint + 'accounts/login',
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
				url: endpoint + 'accounts/refresh_token',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data:{
					'accessToken':accessToken,
					'refreshToken':refreshToken
				},
				responseType: 'json'
			}).catch(err=>{this.log.error('Error refresing token %s', JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('refresh response',JSON.stringify(response.data,null,2))}
			return  response
		}catch(err) {this.log.error('Error refreshing token %s', err)}
	},
	
	profile: async function(token){
		try {  
			this.log.debug('Retrieving user profile')
			let response = await axios({
				method: 'get',
				url: endpoint+'accounts/profile',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
					'Authorization': 'Bearer '+token
				},
				responseType: 'json'
			}).catch(err=>{this.log.error('Error getting user profile %s', JSON.stringify(err.config,null,2))})
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
						url: endpoint+'accounts/products',
						headers: {
              'Accept': 'application/json',
							'Content-Type': 'application/json',
							'Authorization': 'Bearer '+token
						},
						responseType: 'json'
				}).catch(err=>{this.log.error('Error getting products %s', JSON.stringify(err.config,null,2))})
				if(response){	this.log.debug('get products data response',JSON.stringify(response.data,null,2))}	
				return response
			}catch(err) {this.log.error('Error retrieving products %s', err)}
		},

	site: async function(token,chargerId){
		try {  
				this.log.debug('Retrieving site info')
				let response = await axios({
						method: 'get',
						url: endpoint+'chargers/'+chargerId+site,
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
							'Authorization': 'Bearer '+token
						},
						responseType: 'json'
				}).catch(err=>{this.log.error('Error getting site %s', JSON.stringify(err.config,null,2))})
				if(response){this.log.debug('get site data response',JSON.stringify(response.data,null,2))}
				return response
			}catch(err) {this.log.error('Error site products %s', err)}
		},	
	
	chargers: async function(token){
		try {  
			this.log.debug('Retrieving chargers')
			let response = await axios({
					method: 'get',
					url: endpoint+'chargers',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error getting chargers %s', JSON.stringify(err.config,null,2))})
			if(response){	this.log.debug('get chargers config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving chargers %s', err)}
	},

	charger: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger info')
			let response = await axios({
					method: 'get',
					url: endpoint+'chargers/'+chargerId,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error getting charger info %s', JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('get charger info config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger info %s', err)}
	},

	chargerDetails: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger details')
			let response = await axios({
					method: 'get',
					url: endpoint+'chargers/'+chargerId+'/details',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error getting charger details %s', JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('get charger details config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger details %s', err)}
	},

	state: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger state')
			let response = await axios({
					method: 'get',
					url: endpoint+'chargers/'+chargerId+'/state',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error getting charger state %s', JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('get charger state config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger state %s', err)}
	},

	getConfig: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger config')
			let response = await axios({
					method: 'get',
					url: endpoint+'chargers/'+chargerId+'/config',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error getting charger config %s', JSON.stringify(err.config,null,2))})
			if(response){	this.log.debug('get charger config response',JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error retrieving charger config %s', err)}
	},

	lock: async function(token,chargerId,value){
		//change charger settings
		try {  
			this.log.debug('Setting charger lock state for %s',chargerId,value)
			let response = await axios({
					method: 'post',
					url: endpoint+'chargers/'+chargerId+'/settings',
					headers: {
            'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					data:{
						'enabled':value
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error locking charger config %s', JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('post lock response',response.status)}
			return response
		}catch(err) {this.log.error('Error setting lock state config %s', err)}
	},

	light: async function(token,chargerId,value){
		//change charger settings
		try {  
			this.log.debug('Setting LED light for %s',chargerId,value)
			let response = await axios({
					method: 'post',
					url: endpoint+'chargers/'+chargerId+'/settings',
					headers: {
            'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					data:{
						'ledStripBrightness':value
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error setting LED lights %s', JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('post light response',response.status)}
			return response
		}catch(err) {this.log.error('Error setting light %s', err)}
	},

	command: async function(token,chargerId,command){
		try {  
			this.log.debug('%s for %s',command, chargerId)
			let response = await axios({
					method: 'post',
					url: endpoint+'chargers/'+chargerId+'/commands/'+command,
					headers: {
            'Accept': 'application/json',
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+token
					},
					responseType: 'json'
			}).catch(err=>{this.log.error('Error posting %s command  %s', command, JSON.stringify(err.config,null,2))})
			if(response){this.log.debug('post %s response',command, JSON.stringify(response.data,null,2))}
			return response
		}catch(err) {this.log.error('Error %s %s', command, err)}
	}
}

module.exports = easeeAPI