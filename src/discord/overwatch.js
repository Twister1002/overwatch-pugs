const { MessageEmbed } = require("discord.js");
const { parseToNumber, getSRTier, getRandomInt, saveFile, loadFile, getCommand } = require("./utilities");
const { createOverWatchMatch, setMatchConfig, getMatchConfig } = require("./match");
const allowedRoles = require("../data/roles.json");
const maps = require("../data/maps.json");

let allowQueue = false;
let playersInQueue = [];

function overwatch(message, command, messageData) {
    let response = "";
    let isReply = false;
    let deleteMessage = false;

    switch (command.name) {
        case "info": {
            isReply = true;
            let userTag = message.mentions.users.first() ? message.mentions.users.first().tag : message.author.tag;
            const playerData = getPlayerDataByDiscordTag(userTag)

            if (playerData) {
                response = `BTag: ${playerData.btag}; Tank: ${playerData.tank}; DPS: ${playerData.dps}; Support: ${playerData.support}`;
            }
            else {
                response = `No record exists for ${userTag}. Please set your info using '!pugs setInfo'`;
            }
        }
            break;
        case "set": {
            isReply = true;

            // Need to find a new way to handle parameters
            const btagIndex = messageData.findIndex(p => p.toLowerCase().includes("btag"));
            const supportIndex = messageData.findIndex(p => p.toLowerCase().includes("support"));
            const dpsIndex = messageData.findIndex(p => p.toLowerCase().includes("dps"));
            const tankIndex = messageData.findIndex(p => p.toLowerCase().includes("tank"));

            const bTagInfo = btagIndex > -1 ? messageData[btagIndex + 1] : null;
            const tankRank = tankIndex > -1 ? parseToNumber(messageData[tankIndex + 1]) : undefined;
            const supportRank = supportIndex > -1 ? parseToNumber(messageData[supportIndex + 1]) : undefined;
            const dpsRank = dpsIndex > -1 ? parseToNumber(messageData[dpsIndex + 1]) : undefined;

            const savedPlayerData = savePlayerPugData(message.author, bTagInfo, supportRank, tankRank, dpsRank);
            if (savedPlayerData) {
                response = `Saved as ${savedPlayerData.btag} Tank: ${savedPlayerData.tank}; DPS: ${savedPlayerData.dps}; Support: ${savedPlayerData.support}`;
            }
            else {
                console.log("Failed to save PUGs data");
                response = "Failed to save data";
            }
        }
            break;
        case "startq": {
            playersInQueue = [];
            allowQueue = true;
            const commandInfo = getCommand("ow", "q");

            response = `Queue has been opened.\nTo queue for a role, please use \`!pugs ${commandInfo.command} ${commandInfo.args}\`.`;
        } break;
        case "stopq": {
            allowQueue = false;
            response = "Queue has been closed";
        }
            break;
        case "quser": {
            deleteMessage = true;
            isReply = false;
            const playerToQueue = message.mentions.users.first();
            messageData.shift(); // This is only needed to remove the tag
            response = addPlayerToQueue(playerToQueue.tag, messageData);
            response = `${playerToQueue} ` + response;
        }
            break;
        case "q": {
            response = addPlayerToQueue(message.author.tag, messageData);
            isReply = true;
            deleteMessage = true;
        }
            break;
        case "unq": {
            isReply = true;
            deleteMessage = true;

            if (allowQueue) {
                const players = [...playersInQueue.filter(p => p.discordName !== message.author.tag)];
                playersInQueue = players;
                response = `has been removed from queue`
            }
            else {
                response = "PUGs does not currently have a queue. Please wait for a mod to start the queue"
            }
        }
            break;
        case "lobby": {
            response = `${playersInQueue.length} players in queue:\n`;
            playersInQueue.forEach(p => {
                response += `\n- ${p.discordName} (${p.queue.join(",")})`
            })
        }
            break;
        case "startmatch": {
            response = createMatch(message.channel);
        }
            break;
        case "maps": {
            // Display all map's name
            maps.forEach(m => response += `- ${m}\n`)
        }
            break;
        case "users": {
            // Display all user's data
            const allPlayers = getAllPlayerData();
            response = `Users Registered: ${allPlayers.length}\n`;

            allPlayers.forEach(p => {
                response += `- ${p.discordName} (${p.btag})\n`
            })
        }
            break;
        case "testmatch": {
            const testPlayerData = getAllPlayerData();

            allowQueue = true;
            for (let i = 0; i < testPlayerData.length; i++) {
                const player = testPlayerData.splice(getRandomInt(0, testPlayerData.length), 1)[0];
                const roles = allowedRoles.filter(r => player[r] > 500);

                addPlayerToQueue(player.discordName, roles);
            }
            allowQueue = false;

            response = createMatch(message.channel);
        }
            break;
        case "setup": {
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
        }
            break;
        
    }

    sendMessageToServer(message, response, isReply, deleteMessage);
}

function addPlayerToQueue(discordName, roles) {
    let response = "";
    const player = getPlayerDataByDiscordTag(discordName);
    const wantedRoles = roles.includes("all") ? [...allowedRoles] : roles;
    const filteredRoles = wantedRoles.filter(r => player[r.toLowerCase()] >= 500).map(r => r.toLowerCase());

    if (allowQueue) {
        if (roles.length > 0) {
            if (filteredRoles.length > 0) {
                const inQueue = playersInQueue.filter(q => q.discordName !== discordName);
                inQueue.push({
                    discordName,
                    queue: filteredRoles
                })

                playersInQueue = inQueue;
                response = `is queued for ${filteredRoles.join(", ")}.`
            }
            else {
                response = `You can not queue for with invalid SR. ${filteredRoles.map(r => `${r} (${player[r]})`).join(" ")}`
            }
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

function createMatch(channel) {
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

        while ((matchDetails === null || matchDetails.hasError) && matchesCreated < 5000) {
            matchesCreated++;
            matchDetails = createOverWatchMatch(playerList);

            if (matchDetails.hasFatalError) {
                break;
            }
        }

        if (matchesCreated >= 5000) {
            response = `Unable to create a suitable match within ${matchesCreated} tries. Please restart queue.`
        }
        else if (matchDetails.hasError || matchDetails.hasFatalError) {
            if (matchDetails.hasError) {
                console.log(matchDetails.responseMessage);

                if (matchDetails.hasFatalError) {
                    response = matchDetails.responseMessage;
                }
            }
        }
        else {
            const embeddedMessage = new MessageEmbed()
                .setColor("#0099ff")
                .setTitle("Overwatch Match")
                .setDescription(`Map: ${matchDetails.map}`)

            matchDetails.teams.forEach((team) => {
                embeddedMessage.addField("\u200B", "\u200B", false)
                embeddedMessage.addField(`Team ${team.name}`, team.avgSR(), false);
                embeddedMessage.addField(`Tanks:`, team.tank.map(x => `${(x.discordid ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.btag}\n${x.tank} - ${getSRTier(x.tank)}\n`).join("\n") || "None", true)
                embeddedMessage.addField(`DPS:`, team.dps.map(x => `${(x.discordid ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.btag}\n${x.dps} - ${getSRTier(x.dps)}\n`).join("\n") || "None", true)
                embeddedMessage.addField(`Supports:`, team.support.map(x => `${(x.discordid ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.btag}\n${x.support} - ${getSRTier(x.support)}\n`).join("\n") || "None", true)
            })

            console.log(`Created match after ${matchesCreated} attempts`)
            channel.send({ embed: embeddedMessage });
        }
    }
    else {
        channel.send("Queue must be closed to start a match.");
    }

    return response;
}

function sendMessageToServer(message, response, isReply = false, deleteMessage = false) {
    if (response && response.length > 0) {
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
}

function savePlayerPugData(discordUser, btag, support, tank, dps) {
    const pugData = getAllPlayerData();

    let playerData = pugData.find(p => p.discordName === discordUser.tag);

    if (playerData) {
        console.log(`Updating player ${discordUser.tag}`);
        playerData.discordid = discordUser.id || playerData.discordid;
        playerData.discordName = discordUser.tag || playerData.discordName;
        playerData.btag = btag || playerData.btag;
        playerData.support = Number.isFinite(support) ? support : playerData.support || 0;
        playerData.dps = Number.isFinite(dps) ? dps : playerData.dps || 0;
        playerData.tank = Number.isFinite(tank) ? tank : playerData.tank || 0;
    }
    else {
        console.log(`Adding new player ${discordUser.tag}`);
        playerData = {
            discordid: discordUser.id,
            discordName: discordUser.tag,
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
        return playerData;
    }
    catch (e) {
        console.error("Unable to save player data...")
        console.log(playerData)
        return null;
    }
}

function getPlayerDataByDiscordTag(discordName) {
    return getAllPlayerData().find(p => p.discordName === discordName);
}

function getAllPlayerData() {
    const pugData = loadFile("overwatchpugs.json");

    return pugData;
}

module.exports = overwatch;