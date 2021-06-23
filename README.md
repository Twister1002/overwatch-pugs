# PUGs Bot for MissElise's Discord Server

## FUTURE: 
- Implement a database using SQLite (This could be the start of allowing multiple servers)
 - DB Tables 
 - Match History
- Allow mods to create new users

## Bugs:
- Fix parsing issue with setting players info

## Version 1.2.4
- Fixed bug where valorant would attempt to make a match when not enough players are queued
- Removed old file from tracking in the depot
- Combined Overwatch maps in with its configuration data
- Fixed bug when updating from 1.1.1
- Fixed bug where users could be added to queue when game data doesn't exist for the user

## Version 1.2.0
- Implemented Valorant. Users can now used !val as a command to do basic commands like overwatch
- Updated and moved methods to utility methods
- Overwatch command changed to !ow
- Fixed isses and problems with commands
- Updated Overwatch configuration data
- Updated main entrance to bot 
 - Now only listens to incomming messages from users instead of itself.
 - Fixed bugs and crashes relating to incomming messages without commands
- Fixed bug with overwatch matchmaking not checking for SR difference
- Added global commands

## Version 1.1.1
- Created update code to convert player data to usable data information for each game
- Updated match making code to reflect update code

## Version 1.1.0
- Code refactoring to allow new implementations of other games

## Version 1.0.5
- Displays match information within an embedded block
- Players can now queue with the "all" option. It will queue them for all roles available to them
- Players playing in a match are now pingged
- Players being removed from queue now deletes messages
- Players setting their info will now: 
 - No longer sets roles to 0
 - Adds their DiscordID
- Fixed issues with messages being sent without a length
- Fixed some text errors in response to a command
- Fixed bug when queuing for roles without proper SR values
- Fixed help information 
- Fixed issue with hard crashing and recover more gracefully to prevent unusable bot
- Fixed bug where users could not queue if their SR was 500 or below. Users must have 500 or above

## Version 1.0.4
- Added a help command to provide info and arguments 
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