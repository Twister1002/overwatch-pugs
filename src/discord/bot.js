require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getRandomInt, parseToNumber } = require("./utilities");
const CreateOverwatchMatch = require("./match");
const allowedRoles = require("../data/roles.json");
const maps = require("../data/maps.json");

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

client.on("ready", (data) => {
    console.log(client.user.tag);
    client.user.setActivity('!pugs', { type: 'LISTENING'} )
})

client.on("message", (message) => {
    const messageData = message.content.split(" ");
    let response = "";

    if (messageData.shift().toLowerCase() === "!pugs") {
        switch (messageData.shift().toLowerCase()) {
            case "info": 
                let userTag = null;
                if (message.mentions.users.first()) {
                    userTag = message.mentions.users.first().tag
                }
                else {
                    userTag = message.author.tag;
                }
                
                console.log(userTag);
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
                // Make sure the author is only a mod!
                // { discordName: blah, queue: [] }
                playersInQueue = [];
                allowQueue = true;
                message.channel.send("Queue has been opened");
                break;
            case "stopq": 
                allowQueue = false;
                message.channel.send("Queue has been closed");
                break;
            case "q": 
                if (allowQueue) {
                    if (isPlayerRegistered(message.author.tag)) {
                        if (messageData.length === 0) {
                            message.reply(`You need to queue for roles: ${allowedRoles.join(", ")}`)
                        }
                        else {
                            const players = [...playersInQueue.filter(p => p.discordName !== message.author.tag)];
                            const qRoles = messageData.filter(r => players[r] > 500);

                            players.push({
                                discordName: message.author.tag,
                                queue: qRoles
                            })

                            playersInQueue = players;
                            message.reply(`has queued for ${qRoles}`)
                        }
                    }
                    else {
                        message.reply("currently isn't registered. Use !pugs setinfo");
                    }
                }
                else {
                    message.reply("PUGs does not currently have a queue. Please wait for a mod to start the queue");
                }
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
                // Place people in a match on teams
                // Randomly choose map

                // Compile list of players in Queue with their ranks for the Match method
                const playerList = []
                playersInQueue.forEach(p => {
                    const playerInfo = getPlayerDataByDiscordTag(p.discordName);

                    playerList.push({
                        ...playerInfo,
                        name: playerInfo.btag,
                        queue: p.queue
                    })
                })

                const teamData = CreateOverwatchMatch(playerList);
                const randomMap = maps[getRandomInt(0, maps.length)];

                response = `Map: ${randomMap}\n\n`;

                teamData.forEach((team) => {
                    response += `Team ${team.name} (${team.avgSR})\n`
                    
                    response += "\t- Tank\n"
                    team.tank.forEach((t) => {
                        response += `\t\t- ${t.name} (${t.discordName})\n`
                    })

                    response += "\t- DPS\n"
                    team.dps.forEach((d) => {
                        response += `\t\t- ${d.name} (${d.discordName})\n`
                    })

                    response += "\t- Support\n"
                    team.support.forEach((s) => {
                        response += `\t\t- ${s.name} (${s.discordName})\n`
                    })

                    response += "\n"
                })

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
                response = `Users Registered: ${allPlayers.length}`;

                allPlayers.forEach(p => {
                    response += `- ${p.discordName} (BTag: ${p.btag}, Tank: ${p.tank}, DPS: ${p.dps}, Support: ${p.support})\n`
                })
                
                message.channel.send(response);
                break;
            case "testmatch":
                testRandomPlayers()
                const testTeamData = CreateOverwatchMatch(playersInQueue);
                const testRandomMap = maps[getRandomInt(0, maps.length)];

                response = `Map: ${testRandomMap}\n\n`;

                testTeamData.forEach((team) => {
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

                console.log(response);
                message.channel.send(response);
                break;
        }
    }
})


function isPlayerRegistered(discordName) {
    const player = getPlayerDataByDiscordTag(discordName);

    return player ? true : false;
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

function testRandomPlayers() {
    const players = require("../data/overwatchpugs.json");

    for (let i = 0; i < 12; i++) {
        const roles = allowedRoles.filter(r => players[i][r] > 500);
        console.log(players[i].btag, roles);
        
        playersInQueue[i] = {
            ...players[i],
            name: players[i].btag,
            queue: [...roles]
        }
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