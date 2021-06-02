# PUGs Bot for MissElise's Discord Server

## FUTURE: 
- Place users in NoSQL DB
- Create DB tables 
- Create match history information in DB
- Allow mod to set amount of players on teams
- Allow mod to create user
 - Need to think about 

## Version 1.0.4
- Mods can now queue any tagged discord user and specific role
- Mods can now modify match settings by specifing settings and a value
  - srdiff
  - support
  - tank
  - dps
  - teams


## Version 1.0.3
- Fixed bug that would cause infinate loops when creating a match. (Now only attempts 5000 times before breaking)
- Fixed bug that would allow matches that exceed the max SR differencial.

## Version 1.0.2
- Fixed bug with loading production and development bot with enviornment variables

## Version 1.0.1
- Fixed bug that would not allow users to be displayed due to message length
- Added tokens for dev and prod bots
- All responses from bot commands now all go through a special method for processing is multiple messages necessarry.
- Added dev workarounds
- Updated command from !pugs setinfo to !pugs set
- Removed an async method that really made no sense to have it

## Version 1.0.0
- Base commit of all data
- Refactored code for match making to make it more efficent