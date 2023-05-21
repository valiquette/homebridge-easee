# Changes

## 1.2.2
fix
-  403 error during startup due to Easse API Domain change and SignalR URI change.
-  There are soem new observations that are documented but not yet available in API response. Some logic was added to address this condition

Update
-  Added suppport for node.js v20.
-  Removed support for node.js v14.
-  Bumped dependencies.

## 1.2.1
Fix
-  Fixed bug with multiple SignalR connections being opened at the same time.

## 1.2.0-Beta
Enhancment
-  Verified badge added.
-  Bumped dependancies.
-  Added sensor to display added charge, usefull for homekit automation.
-  Improved battery state calulation.
-  Added support for Easee Equalizer.
-  Added support to change dynamic charging current.
-  Updated list of error codes.
-  Fix bug with lock updating.
-  Logging cleanup.
-  Add config options for additional logging
-  Code cleanup.
-	Cleanup whitespace.

## 1.1.9
Fix
- Bumped dependancies
- Added explict user-agent info to API calls.
- Code cleanup

## 1.1.8
Fix
- Fixed bug with refreshing API token

## 1.1.7
Update
- Code cleanup
- Updated streaming endpoint

## 1.1.6
Fix
- Fixed an issue where signalR was not automatically reconnecting following netowrk connection interuption.
- Tied battery service option to having a car defined.

## 1.1.5
Fix
- Fixed condition causing crash when pause/resume

## 1.1.4
Update
- Added optional switch to override chargign schedules
- Added device name to optional switches
- Will show extimated charge until disconnected
- Bumped dependancies
- Code cleanup

## 1.1.3
Update
-	Added battery info for multiple cars. Will need to update config with new info
- Added optional switch to reboot charger.

## 1.1.2
Update
- Suppessed extra logging info that does nto need action.
- Fixed sync for LED light on/off when turnign back on.
- Added location support.
- Inital support to track battery charge added, will need to update config with info

## 1.1.1
Update
- Fixed logging messages for op mode changes
- Programmed LED light on/off
- Fixed sync for charging state

## 1.1.0
Update
- Updates now using SignlR
- Removed Polling requirement
- Expose more loging info for development

## 1.0.5
Fix
- Fixed bug with resuming charge

## 1.0.3
Fix
- Fixed a numeber of bugs

## 1.0.2-beta.0
Update
- Experimental switches

## 1.0.1-beta.1
Update
- Extra HomeKit info

## 0.0.1-beta.0
Devlopment
- Support for Easee Charger

