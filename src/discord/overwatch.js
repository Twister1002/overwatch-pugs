const { MessageEmbed } = require("discord.js");
const { 
    parseToNumber,
    getSRTier,
    getRandomInt,
    getCommand,
    getPlayerDataByDiscordTag,
    getAllPlayerData,
    addPlayer 
} = require("./utilities");
const { createOverWatchMatch, setMatchConfig, getMatchConfig } = require("./match");
const overwatchConfig = require("../data/overwatchconfig.json");

let allowQueue = false;
let playersInQueue = [];

function overwatch(message, command, messageData) {
    let response = "";
    let isReply = false;
    let deleteMessage = false;

    switch (command.name) {
        case "info": {
            let userTag = message.mentions.users.first() ? message.mentions.users.first().tag : message.author.tag;
            const playerData = getPlayerDataByDiscordTag(userTag)

            if (playerData.ow) {
                if (message.author.tag === playerData.discordName) {
                    isReply = true;
                }

                response = `BTag: ${playerData.ow.btag};`;
                response +=  playerData.ow.tank ? ` Tank: ${playerData.ow.tank};` : ``;
                response +=  playerData.ow.dps ? ` DPS: ${playerData.ow.dps};` : ``;
                response +=  playerData.ow.support ? ` Support: ${playerData.ow.support}` : ``;
            }
            else {
                response = `No record exists for ${userTag}.`;

                if (message.author.tag === playerData.discordName) {
                    isReply = true;
                    const setCommand = getCommand("val", "set");
                    response += ` Please set your info using '!ow ${setCommand.name} ${setCommand.args}'`;
                }
            }
        }
            break;
        case "set": {
            deleteMessage = true;
            isReply = true;

            // Need to find a new way to handle parameters
            const btagIndex = messageData.findIndex(p => p.toLowerCase().includes("btag"));
            const supportIndex = messageData.findIndex(p => p.toLowerCase().includes("support"));
            const dpsIndex = messageData.findIndex(p => p.toLowerCase().includes("dps"));
            const tankIndex = messageData.findIndex(p => p.toLowerCase().includes("tank"));

            const bTagInfo = btagIndex > -1 ? messageData[btagIndex + 1].replace(/[<>]/g, "") : null;
            const tankRank = tankIndex > -1 ? parseToNumber(messageData[tankIndex + 1]) : undefined;
            const supportRank = supportIndex > -1 ? parseToNumber(messageData[supportIndex + 1]) : undefined;
            const dpsRank = dpsIndex > -1 ? parseToNumber(messageData[dpsIndex + 1]) : undefined;

            const dataToSave = {btag: bTagInfo}
            if (tankRank) { dataToSave.tank = tankRank; }
            if (supportRank) { dataToSave.support = supportRank; }
            if (dpsRank) { dataToSave.dps = dpsRank; }
            const isSaved = addPlayer(message.author, "ow", dataToSave)

            if (isSaved) {
                const playerData = getPlayerDataByDiscordTag(message.author.tag).ow;
                
                response =  playerData.btag ? `Battle Tag: ${playerData.btag};` : ``;
                response +=  playerData.tank ? ` Tank: ${playerData.tank};` : ``;
                response +=  playerData.dps ? ` DPS: ${playerData.dps};` : ``;
                response +=  playerData.support ? ` Support: ${playerData.support}` : ``;
            }
            else {
                console.log("Error in saving user data");
                response = "Failed to save data";
            }
        }
            break;
        case "startq": {
            playersInQueue = [];
            allowQueue = true;
            const commandInfo = getCommand("ow", "q");

            response = `Queue has been opened.\nTo queue for a role, please use \`!ow ${commandInfo.name} ${commandInfo.args}\`.`;
        } 
        break;
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

            const players = [...playersInQueue.filter(p => p.discordName !== message.author.tag)];
            playersInQueue = players;
            response = `has been removed from queue`;
        }
            break;
        case "lobby": {
            response = `${playersInQueue.length} players in queue:\n${playersInQueue.map(x => `- ${x.discordName} (${x.queue.join(",")})`).join("\n")}`;
        }
            break;
        case "startmatch": {
            response = createMatch(message.channel);
        }
            break;
        case "maps": {
            // Display all map's name
            overwatchConfig.maps.forEach(m => response += `- ${m}\n`)
        }
            break;
        case "users": {
            // Display all user's data
            const owPlayers = getAllPlayerData().filter(x => x.ow);
            response = `Users Registered: ${owPlayers.length}\n${owPlayers.map(x => `- ${x.discordName} (${x.ow.btag})`).join("\n")}`;
        }
            break;
        case "testmatch": {
            // const testPlayerData = getAllPlayerData().filter(x => x.ow);

            allowQueue = true;
            // for (let i = 0; i < testPlayerData.length; i++) {
            //     const player = testPlayerData.splice(getRandomInt(0, testPlayerData.length), 1)[0];
                
            //     addPlayerToQueue(player.discordName, ["all"]);
            // }

            // Test case for invalid match and could not be created.
            addPlayerToQueue("Jesus Christ#1216", ["tank", "dps"]);
            addPlayerToQueue("Skateking-#7517", ["dps"]);
            addPlayerToQueue("Sparlin#3892", ["all"]);
            addPlayerToQueue("Arkonon#5896", ["all"]);
            addPlayerToQueue("Edant#3834", ["support"]);
            addPlayerToQueue("Sen#4444", ["dps", "tank"]);
            addPlayerToQueue("Flowingfiber#8311", ["dps","support"]);
            addPlayerToQueue("Sirloin77#4166", ["all"]);
            addPlayerToQueue("Rain#0006", ["all"]);
            addPlayerToQueue("!Spoodini#9821", ["dps"]);
            addPlayerToQueue("Slim_and_Shady#5291", ["tank","dps"]);
            addPlayerToQueue("Nanybanany#3765", ["support"]);
            
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
    const wantedRoles = roles.includes("all") ? overwatchConfig.roles.map(x => x.name) : roles;
    const filteredRoles = wantedRoles.filter(r => player.ow[r.toLowerCase()] >= 500).map(r => r.toLowerCase());

    if (allowQueue) {
        if (player.ow) {
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
                    response = `You can not queue for with invalid SR. ${filteredRoles.map(r => `${r} (${player.ow[r]})`).join(" ")}`
                }
            }
            else {
                response = "You must provide a role to queue for."
            }
        }
        else {
            const setCommand = getCommand("val", "set");
            response = `No record exists for ${userTag}. Please set your info using '!ow ${setCommand.name} ${setCommand.args}'`;
        }
    }
    else {
        response = "The queue for Overwatch is not currently not accepting new applications."
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
                ...playerInfo.ow,
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
                embeddedMessage.addField(`Tanks:`, team.tank.map(x => `${(x.discordid ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow.btag}\n${x.ow.tank} - ${getSRTier(x.ow.tank)}\n`).join("\n") || "None", true)
                embeddedMessage.addField(`DPS:`, team.dps.map(x => `${(x.discordid ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow.btag}\n${x.ow.dps} - ${getSRTier(x.ow.dps)}\n`).join("\n") || "None", true)
                embeddedMessage.addField(`Supports:`, team.support.map(x => `${(x.discordid ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow.btag}\n${x.ow.support} - ${getSRTier(x.ow.support)}\n`).join("\n") || "None", true)
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

module.exports = overwatch;