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
			let response = {"data":{
				"accessToken": "string",
				"expiresIn": 86400,
				"accessClaims": [
					"string"
				],
				"tokenType": "string",
				"refreshToken": "refreshstring"
			}}
			this.log.debug('login response',JSON.stringify(response.data,null,2))
			return  response
		}catch(err) {this.log.error('Error retrieving token %s', err)}
	},

	refreshToken: async function(accessToken,refreshToken){
		try {  
			this.log.debug('Refreshing token')
			let response = {"data":{
				"accessToken": "string",
				"expiresIn": 86400,
				"accessClaims": [
					"string"
				],
				"tokenType": "string",
				"refreshToken": "refreshstring"
			}}
			this.log.debug('refresh response',JSON.stringify(response.data,null,2))
			return  response
		}catch(err) {this.log.error('Error refreshing token %s', err)}
	},
	
	profile: async function(token){
		try {  
			this.log.debug('Retrieving user info')
			let response = {"data":{
				"userId": 0,
				"eMail": "string",
				"phoneNo": "string",
				"firstName": "test",
				"lastName": "case",
				"street": "string",
				"zipCode": "string",
				"city": "string",
				"country": "string",
				"countryId": "string",
				"emailVerified": true,
				"subscribeNewProductUpdate": true,
				"subscribeProductUpdate": true,
				"company": "string",
				"isActive": true,
				"isBetaTester": true
			}}
			this.log.debug('get user response',JSON.stringify(response.data,null,2))
			return response //userID
		}catch(err) {this.log.error('Error retrieving user ID %s', err)}
	},

	products: async function(token,userId){
		//is userID needed
		try {  
				this.log.debug('Retrieving products info')
				let response = {"data":[
					{
					"userRole": 1,
					"allowedSiteActions": [
					"AllowToConfigureLevelOfAccess"
					],
					"partnerId": 21,
					"ownerPartnerId": null,
					"useDynamicMaster": false,
					"circuits": [
					{
					"chargers": [
					{
					"userRole": 1,
					"isTemporary": false,
					"id": "EH123",
					"name": "Autoladegerät 2",
					"color": 2,
					"createdOn": "2021-04-12T05:11:13.123206",
					"updatedOn": "2021-11-22T09:01:07.228822",
					"backPlate": {
					"id": "816XXXXXXXXXXX",
					"masterBackPlateId": "816XXXXXXXXXXX",
					"name": null
					},
					"levelOfAccess": 1,
					"productCode": 1
					},
					],
					"masterBackplate": null,
					"useDynamicMaster": false,
					"parentCircuitId": null,
					"id": 12345,
					"siteId": 13467,
					"circuitPanelId": 17,
					"panelName": "17",
					"ratedCurrent": 32
					}
					],
					"equalizers": [],
					"createdOn": "2021-08-13T15:58:03.576563",
					"updatedOn": "2022-02-04T11:22:14.839687",
					"contactInfo": {
					"installerName": "XXXXXXXX",
					"installerPhoneNumber": "XXXXXXX",
					"ownerName": "XXXXXXX",
					"ownerPhoneNumber": "+XXXXXXXX",
					"company": "Zuhause"
					},
					"costPerKWh": 0.29,
					"costPerKwhExcludeVat": 0.2437,
					"vat": 19,
					"currencyId": "EUR",
					"siteType": 1,
					"ratedCurrent": 50,
					"id": 13467,
					"siteKey": "LXXX-ZXXX",
					"name": "Garage",
					"levelOfAccess": 3,
					"address": {
					"street": "easy street",
					"buildingNumber": "",
					"zip": "XXXXX",
					"area": "XXXXXXX",
					"country": {
					"id": "DE",
					"name": "Germany",
					"phonePrefix": 0
					},
					"latitude": null,
					"longitude": null,
					"altitude": null
					}
					}
					]
				}
				this.log.debug('get products data response',JSON.stringify(response.data,null,2))
				return response
			}catch(err) {this.log.error('Error retrieving products %s', err)}
		},

	site: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving site info')
			let response = {"data":{
				"partnerId": 20,
				"ownerPartnerId": null,
				"useDynamicMaster": false,
				"circuits": [
				{
				"chargers": [
				{
				"userRole": null,
				"isTemporary": false,
				"id": "EHXXXXXX",
				"name": "Autoladegerät 2",
				"color": 2,
				"createdOn": "2021-04-12T05:11:13.123206",
				"updatedOn": "2021-11-22T09:01:07.228822",
				"backPlate": {
				"id": "816XXXXXXXX",
				"masterBackPlateId": "816XXXXXXXX",
				"name": "Autoladegerät 2"
				},
				"levelOfAccess": 1,
				"productCode": 1
				},
				{
				"userRole": null,
				"isTemporary": false,
				"id": "EHXXXXXX",
				"name": "Autoladegerät 1",
				"color": 2,
				"createdOn": "2021-04-12T05:12:30.864357",
				"updatedOn": "2021-11-22T09:00:50.355545",
				"backPlate": {
				"id": "816XXXXXXXXX",
				"masterBackPlateId": "816XXXXXXX",
				"name": "Autoladegerät 1"
				},
				"levelOfAccess": 1,
				"productCode": 1
				}
				],
				"masterBackplate": {
				"id": "816XXXXXXX",
				"masterBackPlateId": "816XXXXXXX",
				"name": "Autoladegerät 1"
				},
				"useDynamicMaster": false,
				"parentCircuitId": null,
				"id": 1245,
				"siteId": 1357,
				"circuitPanelId": 17,
				"panelName": "17",
				"ratedCurrent": 32
				}
				],
				"equalizers": [],
				"createdOn": "2021-08-13T15:58:03.576563",
				"updatedOn": "2022-02-13T06:27:01.145479",
				"contactInfo": {
				"installerName": null,
				"installerPhoneNumber": null,
				"ownerName": "XXXXXXXX",
				"ownerPhoneNumber": "+49",
				"company": "Zuhause"
				},
				"costPerKWh": 0.29,
				"costPerKwhExcludeVat": 0.2437,
				"vat": 19,
				"currencyId": "EUR",
				"siteType": 1,
				"ratedCurrent": 50,
				"id": 1333,
				"siteKey": "LXXXXXXX",
				"name": "Garage",
				"levelOfAccess": 3,
				"address": {
				"street": "XXXXX",
				"buildingNumber": "",
				"zip": "XXXXX",
				"area": "XXXXX",
				"country": {
				"id": "DE",
				"name": "Germany",
				"phonePrefix": 0
				},
				"latitude": null,
				"longitude": null,
				"altitude": null
				}
				}}
				this.log.debug('get site data response',JSON.stringify(response.data,null,2))
				return response
			}catch(err) {this.log.error('Error site products %s', err)}
		},	
	
	chargers: async function(token){
		try {  
			this.log.debug('Retrieving chargers')
			let response = {"data":[
				{
				"id": "EHXXXXXX",
				"name": "Autoladegerät 2",
				"color": 2,
				"createdOn": "2021-04-12T05:11:13.123206",
				"updatedOn": "2021-11-22T09:01:07.228822",
				"backPlate": null,
				"levelOfAccess": 1,
				"productCode": 1
				},
				{
				"id": "EHXXXXXX",
				"name": "Autoladegerät 1",
				"color": 2,
				"createdOn": "2021-04-12T05:12:30.864357",
				"updatedOn": "2021-11-22T09:00:50.355545",
				"backPlate": null,
				"levelOfAccess": 1,
				"productCode": 1
				}
				]}
			this.log.debug('get chargers config response',JSON.stringify(response.data,null,2))
			return response
		}catch(err) {this.log.error('Error retrieving chargers %s', err)}
	},

	charger: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger info')
			let response = {"data":{
				"id": "EHXXXXXX",
				"name": "Autoladegerät 1",
				"color": 2,
				"createdOn": "2021-04-12T05:12:30.864357",
				"updatedOn": "2021-11-22T09:00:50.355545",
				"backPlate": {
				"id": "816XXXXXXXXXX",
				"masterBackPlateId": "816XXXXXXXXX",
				"name": null
				},
				"levelOfAccess": 1,
				"productCode": 1
				}}
			this.log.debug('get charger info config response',JSON.stringify(response.data,null,2))
			return response
		}catch(err) {this.log.error('Error retrieving charger info %s', err)}
	},

	chargerDetails: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger details')
			let response = {"data":{
				"serialNumber": "EH1234",
				"pinCode": "4XXX",
				"product": "Easee Home",
				"unitType": "Secondary",
				"levelOfAccess": 1,
				"partner": {
				"id": 20,
				"name": "Easee",
				"short": null,
				"long": null,
				"bigImage": null,
				"smallImage": null
				}
		}}
			this.log.debug('get charger details config response',JSON.stringify(response.data,null,2))
			return response
		}catch(err) {this.log.error('Error retrieving charger details %s', err)}
	},

	state: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger state')
			let response = {"data":{
				"smartCharging": false,
				"cableLocked": true,
				"chargerOpMode": 1,
				"totalPower": 0,
				"sessionEnergy": 10.2519588470459,
				"energyPerHour": 0,
				"wiFiRSSI": -55,
				"cellRSSI": -93,
				"localRSSI": null,
				"outputPhase": 0,
				"dynamicCircuitCurrentP1": 40,
				"dynamicCircuitCurrentP2": 40,
				"dynamicCircuitCurrentP3": 40,
				"latestPulse": "2022-02-13T06:02:46Z",
				"chargerFirmware": 294,
				"latestFirmware": 294,
				"voltage": 245.5570068359375,
				"chargerRAT": 1,
				"lockCablePermanently": true,
				"inCurrentT2": 0,
				"inCurrentT3": 0,
				"inCurrentT4": 0,
				"inCurrentT5": 0,
				"outputCurrent": 0,
				"isOnline": true,
				"inVoltageT1T2": null,
				"inVoltageT1T3": null,
				"inVoltageT1T4": null,
				"inVoltageT1T5": null,
				"inVoltageT2T3": 245.5570068359375,
				"inVoltageT2T4": 240.38900756835938,
				"inVoltageT2T5": 234.29200744628906,
				"inVoltageT3T4": null,
				"inVoltageT3T5": null,
				"inVoltageT4T5": null,
				"ledMode": 18,
				"cableRating": 32,
				"dynamicChargerCurrent": 32,
				"circuitTotalAllocatedPhaseConductorCurrentL1": null,
				"circuitTotalAllocatedPhaseConductorCurrentL2": null,
				"circuitTotalAllocatedPhaseConductorCurrentL3": null,
				"circuitTotalPhaseConductorCurrentL1": 0.008999999612569809,
				"circuitTotalPhaseConductorCurrentL2": 0.009999999776482582,
				"circuitTotalPhaseConductorCurrentL3": 0.008999999612569809,
				"reasonForNoCurrent": 50,
				"wiFiAPEnabled": false,
				"lifetimeEnergy": 413.3102222222225,
				"offlineMaxCircuitCurrentP1": 32,
				"offlineMaxCircuitCurrentP2": 32,
				"offlineMaxCircuitCurrentP3": 32,
				"errorCode": 0,
				"fatalErrorCode": 0,
				"errors": [],
				"eqAvailableCurrentP1": null,
				"eqAvailableCurrentP2": null,
				"eqAvailableCurrentP3": null,
				"deratedCurrent": 0,
				"deratingActive": false
				}}
			this.log.debug('get charger state config response',JSON.stringify(response.data,null,2))
			return response
		}catch(err) {this.log.error('Error retrieving charger state %s', err)}
	},

	getConfig: async function(token,chargerId){
		try {  
			this.log.debug('Retrieving charger config')
			let response = {"data":{
				"isEnabled": true,
				"lockCablePermanently": true,
				"authorizationRequired": true,
				"remoteStartRequired": true,
				"smartButtonEnabled": true,
				"wiFiSSID": "string",
				"detectedPowerGridType": 0,
				"offlineChargingMode": 0,
				"circuitMaxCurrentP1": 0,
				"circuitMaxCurrentP2": 0,
				"circuitMaxCurrentP3": 0,
				"enableIdleCurrent": true,
				"limitToSinglePhaseCharging": true,
				"phaseMode": 1,
				"localNodeType": 0,
				"localAuthorizationRequired": true,
				"localRadioChannel": 0,
				"localShortAddress": 0,
				"localParentAddrOrNumOfNodes": 0,
				"localPreAuthorizeEnabled": true,
				"localAuthorizeOfflineEnabled": true,
				"allowOfflineTxForUnknownId": true,
				"maxChargerCurrent": 0,
				"ledStripBrightness": 80,
				"chargingSchedule": "string"
			}}
			this.log.debug('get charger config response',JSON.stringify(response.data,null,2))
			return response
		}catch(err) {this.log.error('Error retrieving charger config %s', err)}
	},

	lock: async function(token,chargerId,value){
		let response = {"status":200}
		this.log.debug('post lock response',response.status)
		return response
	},
	
	light: async function(token,chargerId,value){
		let response = {"status":200}
		this.log.debug('post light response',response.status)
		return response
	},

	command: async function(token,chargerId,command){
		try {  
			this.log.debug('%s for %s',command, chargerId)
			let response = {
				"status":200,
				"data":{
					"device": "IDXXXXX",
					"commandId": 25,
					"ticks": 6378024
				}			
			}
			this.log.debug('post %s response',command, JSON.stringify(response.data,null,2))
			return response
		}catch(err) {this.log.error('Error %s %s', command, err)}
	}
}

module.exports = easeeAPI