<p align="left">
 <img width="300" src="logo/easee.png" />
</p>

# homebridge-easee
<br>Easee platform plugin for [Homebridge](https://github.com/nfarina/homebridge).

## About


<br> Supports the ablity to lock and unlock charger from HomeKit
<br> if you have more than one home on your Easee account you may filter devices for a home based on the street address for the location you want to display in HomeKit.

## Notes on testing

This plugin is being remotly test and verified and may be very buggy.

## Installation
1. Install this plugin using: npm install -g homebridge-easee
3. Use plugin settings to edit ``config.json`` and add your account info.
4. Run Homebridge
5. Pair to HomeKit

## Config.json example with child bridge
```
"platforms": [
	{
			"name": "Easee",
			"username": "username",
			"password": "password",
			"_bridge": {
					"username": "0E:6C:D4:F2:16:EB",
					"port": 35919
			},
			"platform": "easee"
	}
]
```