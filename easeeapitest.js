// Public API info https://developer.easee.cloud/docs

let axios = require('axios')

let endpoint = 'https://api.easee.cloud/api/'

function easeeAPI (platform,log){
	this.log=log
	this.platform=platform
}

easeeAPI.prototype={

}

module.exports = easeeAPI