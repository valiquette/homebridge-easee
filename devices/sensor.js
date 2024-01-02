let easeeAPI=require('../easeeapi')

class sensor {
	constructor(platform, log) {
		this.log = log
		this.platform = platform
		this.easeeapi = new easeeAPI(this, log)
	}
	
	createSensorService(device, type) {
		this.log.info('Adding sensor for %s charger ', device.name)
		this.log.debug("create new sensor")
		let humiditySensor = new Service.HumiditySensor(type, device.id)
		let stateOfCharge = 0
		if (device.stateOfCharge)
			(stateOfCharge = device.stateOfCharge)
		humiditySensor = new Service.HumiditySensor(type, device.id)
		humiditySensor
			.setCharacteristic(Characteristic.Name, device.name + ' ' + type)
			.setCharacteristic(Characteristic.CurrentRelativeHumidity, stateOfCharge)
		return humiditySensor
	}

	configureSensorService(device, sensorStatus) {
		this.log.debug("configured %s sensor for %s", sensorStatus.getCharacteristic(Characteristic.Name).value, device.name)
		sensorStatus
			.getCharacteristic(Characteristic.CurrentRelativeHumidity)
	}
}
module.exports = sensor