const PlatformEasee = require('./easeeplatform')

module.exports = (homebridge) => {
  PlatformAccessory = homebridge.platformAccessory
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  UUIDGen = homebridge.hap.uuid
  PluginName = 'homebridge-easee'
  PlatformName = 'easee'
  
  homebridge.registerPlatform(PluginName, PlatformName, PlatformEasee, true)
}