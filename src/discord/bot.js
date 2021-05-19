require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getRandomInt, parseToNumber } = require("./utilities");
const CreateOverwatchMatch = require("./match");
const allowedRoles = require("../data/roles.json");
const maps = require("../data/maps.json");
const pugsCommands = require("../data/commands.json");

const { Client } = require("discord.js");
const client = new Client();

let allowQueue = false;
let playersInQueue = [];
let loginAttempts = 0;
let loginWaitInterval = 10 * 1000;

function loginBot() {
    setTimeout(() => {
        client.login(process.env.DISCORDJS_BOT_TOKEN)
        .then(() => {
            console.log(`Bot has logged in ${client.user.tag}`)
        })
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
    console.log(client.user.tag);
    client.user.setActivity('!pugs', { type: 'LISTENING'} )
})

client.on("message", (message) => {
    let response = "";
    const messageData = message.content.split(" ");
    const mainCommand = messageData.shift().toLowerCase();
    const subCommand = messageData.shift().toLowerCase();
    if (mainCommand === "!pugs") {
        if (!isValidCommand(subCommand)) {
            return;
        }

        if (!canUseCommand(subCommand, message.member)) {
            message.reply("You do not have permissions to use this command");
            return;
        }

        switch (subCommand) {
            case "info": 
                let userTag = message.mentions.users.first() ? message.mentions.users.first().tag : message.author.tag;
                const playerData = getPlayerDataByDiscordTag(userTag)

                if (playerData) {
                    message.reply(`BTag: ${playerData.btag}; Tank: ${playerData.tank}; DPS: ${playerData.dps}; Support: ${playerData.support}`);
                }
                else {
                    message.reply(`No record exists ${userTag}. Please set your info using '!pugs setInfo'`);
                }
                break;

            case "setinfo": 
                // Need to find a new way to handle parameters
                const btagIndex = messageData.findIndex(p => p.toLowerCase().includes("btag"));
                const supportIndex = messageData.findIndex(p => p.toLowerCase().includes("support"));
                const dpsIndex = messageData.findIndex(p => p.toLowerCase().includes("dps"));
                const tankIndex = messageData.findIndex(p => p.toLowerCase().includes("tank"));

                const bTagInfo = btagIndex > -1 ? messageData[btagIndex + 1] : null;
                const tankRank = tankIndex > -1 ? parseToNumber(messageData[tankIndex + 1]) : 0;
                const supportRank = supportIndex > -1 ? parseToNumber(messageData[supportIndex + 1]) : 0;
                const dpsRank = dpsIndex > -1 ? parseToNumber(messageData[dpsIndex + 1]) : 0;

                savePlayerPugData(message.author.tag, bTagInfo, supportRank, tankRank, dpsRank)
                .then(() => {
                    message.reply(`Saved as ${bTagInfo} Tank: ${tankRank}; DPS: ${dpsRank}; Support: ${supportRank}`)
                })
                .catch((e) => {
                    console.log("Failed to save PUGs data");
                    message.reply("Failed to save data");
                })

                break;
            case "startq":
                playersInQueue = [];
                allowQueue = true;
                message.channel.send("Queue has been opened");
                break;
            case "stopq": 
                allowQueue = false;
                message.channel.send("Queue has been closed");
                break;
            case "q": 
                response = addPlayerToQueue(message.author.tag, messageData);
                message.reply(response);
                break;
            case "unq": 
                if (allowQueue) {
                    const players = [...playersInQueue.filter(p => p.discordName !== message.author.tag)];
                    playersInQueue = players;
                    message.reply(`has been removed from queue`)
                }
                else {
                    message.reply("PUGs does not currently have a queue. Please wait for a mod to start the queue");
                }
                break
            case "lobby": 
                response = "";
                playersInQueue.forEach(p => {
                    response += `\n- ${p.discordName} (${p.queue.join(",")})`
                })

                message.channel.send(`Current players in queue: ${response}`)
                break;
            case "startmatch":
                response = createMatch();
                console.log(response);
                message.channel.send(response);
                break;
            case "maps": 
                // Display all map's name
                response = "";
                maps.forEach(m => response += `- ${m}\n`)
                message.channel.send(response);
                break;
            case "users": 
                // Display all user's data
                const allPlayers = getAllPlayerData();
                response = `Users Registered: ${allPlayers.length}\n`;

                allPlayers.forEach(p => {
                    response += `- ${p.discordName} (BTag: ${p.btag}, Tank: ${p.tank}, DPS: ${p.dps}, Support: ${p.support})\n`
                })
                
                message.channel.send(response);
                break;
            case "testmatch":
                const testPlayerData = getAllPlayerData();

                allowQueue = true;
                for (let i = 0; i < 12; i++) {
                    const roles = allowedRoles.filter(r => testPlayerData[i][r] > 500);
                    console.log(testPlayerData[i].btag, roles);
                    
                    addPlayerToQueue(testPlayerData[i].discordName, roles);
                }
                allowQueue = false;

                response = createMatch();
                message.channel.send(response);
                break;
        }
    }
})

function addPlayerToQueue(discordName, roles) {
    let response = "";
    const player = getPlayerDataByDiscordTag(discordName);
    const filteredRoles = roles.filter(r => player[r] > 500);
    
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
        if (playersInQueue.length >= 12) {
            const playerList = []
            const testRandomMap = maps[getRandomInt(0, maps.length)];

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
            const teams = CreateOverwatchMatch(playerList);
                        
            response = `Map: ${testRandomMap}\n\n`;
            teams.forEach((team) => {
                response += `Team ${team.name} (${team.avgSR})\n`
                
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
        else { 
            response = "Must have at least 12 players in queue to start a match."
        }
    }
    else {
        response = "Queue must be closed to start a match."
    }

    return response;
}

function isUserMod(discordUser) {

    const permissionLevels = [
        "Events Staff",
        "Moderator"
    ]
    
    return discordUser.roles.cache.some(r => permissionLevels.includes(r.name));
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

async function savePlayerPugData(discordName, btag, support, tank, dps) {
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
    }
    catch(e) {
        console.error("Unable to save player data...")
        console.log(playerData)
    }
}

function getSRTier(sr) {
    if (sr < 1500) {
        // Bronze
        return "B";
    }
    else if (sr >= 1500 && sr < 2000) {
        // Silver
        return "S";
    }
    else if (sr >= 2000 && sr < 2500) {
        // Gold
        return "G";
    }
    else if (sr >= 2500 && sr < 3000) {
        // Plat
        return "P";
    }
    else if (sr >= 3000 && sr < 3500) {
        // Masters
        return "D";
    }
    else if(sr >= 3500 && sr < 4000) {
        return "M";
    }
    else {
        // GM
        return "GM";
    }
}