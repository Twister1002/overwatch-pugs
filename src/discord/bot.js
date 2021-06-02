require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parseToNumber, getSRTier, getRandomInt } = require("./utilities");
const { createOverWatchMatch, setMatchConfig, getMatchConfig } = require("./match");
const allowedRoles = require("../data/roles.json");
const maps = require("../data/maps.json");
const pugsCommands = require("../data/commands.json");
const modPermissions = require("../data/permissions.json");
const isDev = process.env.NODE_ENV === "development";

const { Client } = require("discord.js");
const client = new Client();

let allowQueue = false;
let playersInQueue = [];
let loginAttempts = 0;
let loginWaitInterval = 10 * 1000;

function loginBot() {
    setTimeout(() => {
        client.login(isDev ? process.env.DEV_BOT_TOKEN : process.env.PROD_BOT_TOKEN)
        .then(() => {})
        .catch(err => {
            loginAttempts++;
            console.error(`Failed login attempt ${loginAttempts}`)
            console.log(err);
            loginBot();
        });
    }, loginAttempts === 0 ? 0 : loginWaitInterval)
}

loginBot();

client.on("ready", () => {
    console.log(`Bot has logged in ${client.user.tag}`)
    client.user.setActivity('!pugs', { type: 'LISTENING'} )
})

client.on("message", (message) => {
    let response = "";
    let isReply = false;
    let deleteMessage = false;
    const messageData = message.content.split(" ");
    const mainCommand = messageData.shift().toLowerCase();

    if (mainCommand === "!pugs") {
        const subCommand = messageData.shift().toLowerCase();
        if (!isValidCommand(subCommand)) {
            console.log(`User attempted to use an invalid command ${subCommand}`)
            return;
        }

        if (!canUseCommand(subCommand, message.member) && !isDev) {
            message.reply("You do not have permissions to use this command");
            return;
        }

        switch (subCommand) {
            case "info": 
                isReply = true;
                let userTag = message.mentions.users.first() ? message.mentions.users.first().tag : message.author.tag;
                const playerData = getPlayerDataByDiscordTag(userTag)

                if (playerData) {
                    response = `BTag: ${playerData.btag}; Tank: ${playerData.tank}; DPS: ${playerData.dps}; Support: ${playerData.support}`;
                }
                else {
                    response = `No record exists ${userTag}. Please set your info using '!pugs setInfo'`;
                }
                break;
            case "set": 
                // Need to find a new way to handle parameters
                const btagIndex = messageData.findIndex(p => p.toLowerCase().includes("btag"));
                const supportIndex = messageData.findIndex(p => p.toLowerCase().includes("support"));
                const dpsIndex = messageData.findIndex(p => p.toLowerCase().includes("dps"));
                const tankIndex = messageData.findIndex(p => p.toLowerCase().includes("tank"));

                const bTagInfo = btagIndex > -1 ? messageData[btagIndex + 1] : null;
                const tankRank = tankIndex > -1 ? parseToNumber(messageData[tankIndex + 1]) : 0;
                const supportRank = supportIndex > -1 ? parseToNumber(messageData[supportIndex + 1]) : 0;
                const dpsRank = dpsIndex > -1 ? parseToNumber(messageData[dpsIndex + 1]) : 0;
                isReply = true;

                if (savePlayerPugData(message.author.tag, bTagInfo, supportRank, tankRank, dpsRank)) {
                    response = `Saved as ${bTagInfo} Tank: ${tankRank}; DPS: ${dpsRank}; Support: ${supportRank}`;
                }
                else {
                    console.log("Failed to save PUGs data");
                    response = "Failed to save data";
                }

                break;
            case "startq":
                playersInQueue = [];
                allowQueue = true;
                response = "Queue has been opened.\nTo queue for a role, please use \`!pugs q Tank, Support, DPS\`. You may queue for any combination of roles";
                break;
            case "stopq": 
                allowQueue = false;
                response = "Queue has been closed";
                break;
            case "quser": 
                deleteMessage = true;
                isReply = false;
                const playerToQueue = message.mentions.users.first();
                messageData.shift(); // This is only needed to remove the tag
                response = addPlayerToQueue(playerToQueue.tag, messageData);
                response = `${playerToQueue} ` + response;
                break;
            case "q": 
                response = addPlayerToQueue(message.author.tag, messageData);
                isReply = true;
                deleteMessage = true;
                break;
            case "unq": 
                isReply = true;

                if (allowQueue) {
                    const players = [...playersInQueue.filter(p => p.discordName !== message.author.tag)];
                    playersInQueue = players;
                    response = `has been removed from queue`
                }
                else {
                    response = "PUGs does not currently have a queue. Please wait for a mod to start the queue"
                }
                break
            case "lobby": 
                response = `${playersInQueue.length} players in queue:\n`;
                playersInQueue.forEach(p => {
                    response += `\n- ${p.discordName} (${p.queue.join(",")})`
                })
                break;
            case "startmatch":
                response = createMatch();
                break;
            case "maps": 
                // Display all map's name
                maps.forEach(m => response += `- ${m}\n`)
                break;
            case "users": 
                // Display all user's data
                const allPlayers = getAllPlayerData();
                response = `Users Registered: ${allPlayers.length}\n`;

                allPlayers.forEach(p => {
                    response += `- ${p.discordName} - BTag: ${p.btag}\n`
                })
                break;
            case "testmatch":
                const testPlayerData = getAllPlayerData();

                allowQueue = true;
                for (let i = 0; i < testPlayerData.length; i++) {
                    const player = testPlayerData.splice(getRandomInt(0, testPlayerData.length), 1)[0];
                    const roles = allowedRoles.filter(r => player[r] > 500);
                    
                    addPlayerToQueue(player.discordName, roles);
                }
                allowQueue = false;

                response = createMatch();
                break;
            case "setup": 
                const settings = {};

                if (messageData.length > 0) {
                    while (messageData.length > 0) {
                        const setting = messageData.shift();
                        const value = messageData.shift();

                        settings[setting] = isNaN(value) ? value : Number(value);
                    }

                    response = setMatchConfig(settings);
                }
                else {
                    const updatedSettings = getMatchConfig();

                    response = JSON.stringify(updatedSettings, (key, value) => (value || ''), 4).replace(/"([^"]+)":/g, '$1:');
                }
                break;
            case "commands":
                const availableCommands = pugsCommands.filter(c => {
                    if (c.isModCommand && isUserMod(message.member)) {
                        return c;
                    }
                    else if (!c.isModCommand) {
                        return c;
                    }
                }).map(c => c.command).join(", ");

                isReply = true;
                response = `Available commands: ${availableCommands}`
                break;
            case "help": 
                isReply = true;
                const commandName = messageData.shift();
                const command = pugsCommands.find(x => x.command === commandName);
                const userCanUseCommand = canUseCommand(commandName, message.member);

                if (command && (userCanUseCommand || isDev)) {
                    response = `${command.help}`
                    if (command.args) {
                        response += `\n\`${command.args}\``
                    }
                }
                else {
                    const helpCommand = pugsCommands.find(x => x.command === "help");
                    response = `No command information found for ${commandName}\n${helpCommand.args}`
                }
                break;
        }

        sendMessageToServer(message, response, isReply, deleteMessage);
    }
})

function addPlayerToQueue(discordName, roles) {
    let response = "";
    const player = getPlayerDataByDiscordTag(discordName);
    const filteredRoles = roles.filter(r => player[r.toLowerCase()] > 500).map(r => r.toLowerCase());
    
    if (allowQueue) {
        if (roles.length > 0) {
            const inQueue = playersInQueue.filter(q => q.discordName !== discordName);
            inQueue.push({
                discordName,
                queue: filteredRoles
            })

            playersInQueue = inQueue;
            response = `is queued for ${filteredRoles.join(", ")}.`
        }
        else {
            response = "You must provide a role to queue for."
        }
    }
    else {
        response = "The queue for PUGs is not open. Please wait for the queue to open."
    }

    return response;
}

function createMatch() {
    let response = "";

    if (!allowQueue) {
        const playerList = []

        // Put all players in a list with all of their data
        playersInQueue.forEach(p => {
            const playerInfo = getPlayerDataByDiscordTag(p.discordName);

            playerList.push({
                ...playerInfo,
                name: playerInfo.btag,
                queue: p.queue
            })
        })
        
        // Place users in the match
        let matchesCreated = 0;
        let matchDetails = null;

        do {
            matchDetails = createOverWatchMatch(playerList);

            if (matchDetails.hasError) {
                console.log(matchDetails.responseMessage);
                
                if (matchDetails.hasFatalError) {
                    break;
                }
            }

            matchesCreated++;
        } while (matchDetails.hasError && matchesCreated < 5000);

        if (matchesCreated >= 5000) {
            response = `Unable to create a suitable match within ${matchesCreated} tries. Please restart queue.`
        }
        else if (matchDetails.hasError || matchDetails.hasFatalError) {
            response = matchDetails.responseMessage;
        }
        else {
            console.log(`Created match after ${matchesCreated} attempts`)
            response = `Map: ${matchDetails.map}\n\n`;
            matchDetails.teams.forEach((team) => {
                response += `Team ${team.name} (${team.avgSR()})\n`
                
                response += "\t- Tank\n"
                team.tank.forEach((t) => {
                    response += `\t\t- ${t.name} (${t.discordName}) - ${t.tank} - ${getSRTier(t.tank)}\n`
                })
                
                response += "\t- DPS\n"
                team.dps.forEach((d) => {
                    response += `\t\t- ${d.name} (${d.discordName}) - ${d.dps} - ${getSRTier(d.dps)}\n`
                })
                
                response += "\t- Support\n"
                team.support.forEach((s) => {
                    response += `\t\t- ${s.name} (${s.discordName}) - ${s.support} - ${getSRTier(s.support)}\n`
                })
                
                response += "\n"
            })
        }
    }
    else {
        response = "Queue must be closed to start a match."
    }

    return response;
}

function sendMessageToServer(message, response, isReply = false, deleteMessage = false) {
    if (response.length > 2000) {
        console.log(`Message exceeds limits of one message ${response.length}`);
        message.channel.send("Unable to send message due to size of message.");
    }
    else if (response.length === 0) {
        console.log(`No message to deliver`);
    }
    else {
        if (isReply) {
            message.reply(response).catch(err => console.error(err));
        }
        else {
            message.channel.send(response).catch(err => console.error(err));
        }

        if (deleteMessage) {
            message.delete().catch(err => console.error(err));
        }
    }
}

function isUserMod(discordUser) {
    return discordUser.roles.cache.some(r => modPermissions.some(m => m.id === r.id));
}

function isValidCommand(command) {
    const theCommand = pugsCommands.find(c => c.command === command);

    return theCommand ? true : false
}

function canUseCommand(command, discordUser) {
    const theCommand = pugsCommands.find(c => c.command === command);

    if (theCommand && theCommand.isModCommand && !isUserMod(discordUser)) {
        return false;
    }

    return true;
}

function loadFile(fileName) {
    const filePath = path.join(__dirname, "../", "data", fileName);
    let fileData = null;

    if (fs.existsSync(filePath)) {
        fileData = fs.readFileSync(filePath);
        const isJSON = fileName.substr(fileName.lastIndexOf(".")).toLowerCase().includes("json") ? true : false;

        if (isJSON) {
            fileData = JSON.parse(fileData);
        }
    }

    return fileData;
}

function saveFile(fileName, data) {
    const filePath = path.join(__dirname, "../", "data", fileName);

    if (fs.existsSync(filePath)) {
        fileData = fs.writeFileSync(filePath, JSON.stringify(data));
    }

    return fileData;
}

function getPlayerDataByDiscordTag(discordName) {
    return getAllPlayerData().find(p => p.discordName === discordName);
}

function getAllPlayerData() {
    const pugData = loadFile("overwatchpugs.json");

    return pugData;
}

function savePlayerPugData(discordName, btag, support, tank, dps) {
    const pugData = loadFile("overwatchpugs.json");

    let playerData = pugData.find(p => p.discordName === discordName);

    if (playerData) {
        console.log(`Updating player ${discordName}`);
        playerData.btag = btag;
        playerData.support = support;
        playerData.dps = dps;
        playerData.tank = tank;
    }
    else {
        console.log(`Adding new player ${discordName}`);
        playerData = {
            discordName,
            btag,
            support,
            tank,
            dps
        };

        pugData.push(playerData);
    }

    // Save file
    try {
        saveFile("overwatchpugs.json", pugData);
        return true;
    }
    catch(e) {
        console.error("Unable to save player data...")
        console.log(playerData)
        return false;
    }
}