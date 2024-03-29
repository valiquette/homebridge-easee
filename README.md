<p align="left">
 <img width="300" src="logo/homebridge-easee.png" />
</p>

# homebridge-easee
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
<br>Easee platform plugin for [Homebridge](https://github.com/nfarina/homebridge).

## About

<br> Supports the ablity to lock and unlock charger from HomeKit
<br> If you have more than one home on your Easee account you may filter devices for a home based on the street address for the location you want to display in HomeKit.

## Notes on testing

This plugin is only been tested with Easee Home Charger.

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
  "cars": [
    {
      "carName": "Volvo",
      "chargerName": "Charger 1",
      "kwH": 78
    },
    {
      "carName": "Tesla",
      "chargerName": "Charger 2",
      "kwH": 84
    }
  ],
  "location_address": "123 Easy St",
  "showControls": 3,
  "showLight": false,
  "useOutlet": true,
  "showReboot": false,
  "showOverride": false,
  "socSensor": true,
  "showEqualizer": false,
  "showSignalRMessages": false,
  "showAPIMessages": false,
  "experimental": true,
  "eqMin": 20,
  "eqMax": 95,
  "_bridge": {
    "username": "0E:46:88:49:71:DD",
    "port": 39306
    },
  "platform": "easee"
  }
  ]
```
showControls valid values
0:None, 1:Toggle, 2:Start/Stop, 3:Pause/Resume, 4:Amperage control with Pause/Resume
