const { getAllPlayerData, getRandomInt, getPlayerDataByDiscordTag } = require("./utilities");
const valorantConfig = require("../data/valorantconfig.json");
const { MessageEmbed } = require("discord.js");

let playersInQueue = [];
let canQueue = false;

function valorant(message, command, messageData) {
    switch (command.name) {
        case "startq": {
            canQueue = true;
            message.channel.send("Queue has been opened for Valorant");
        }
            break
        case "stopq": {
            canQueue = false;
            message.channel.send("Queue has been closed for Valorant");
        }
            break;
        case "q": {
            const response = addPlayerToQueue(message.author.tag);

            if (response.error) {
                message.reply(`Unable to add you to the queue: ${response.message}`)
            }
            else {
                message.reply(`${response.message}`)
            }
        }
            break;
        case "unq": {
            playersInQueue = [...playersInQueue.filter(x => x !== message.author.tag)];
            message.reply("has been removed from queue");
        }
            break;
        case "quser": {
            const playerToQueue = message.mentions.users.first();

            if (playerToQueue) {
                const response = addPlayerToQueue(playerToQueue.tag);

                if (response.error) {
                    message.reply(`Unable to add user to queue: ${response.message}`)
                }
                else {
                    message.reply(`${response.message}`)
                }
            }
            else {
                message.reply("Unable to find user to queue.")
            }
        }
            break;
        case "lobby": {
            let response = `${playersInQueue.length} players in queue:\n${playersInQueue.join("\n")}`;

            message.channel.send(response);
        }
            break;
        case "maps": {

        }
            break;
        case "info": {

        }
            break;
        case "users": {

        }
            break;
        case "set": {

        }
            break;
        case "startmatch": {

        }
            break;
        case "testmatch": {
            canQueue = true;
            const players = getAllPlayerData();
            players.forEach(x => addPlayerToQueue(x.discordName));
            canQueue = false;

            createMatch(message);
        }
            break;
    }
}

function addPlayerToQueue(discordUserTag) {
    const response = {
        error: false,
        message: ""
    };

    if (canQueue) {
        const playerData = getPlayerDataByDiscordTag(discordUserTag);
        const isInQueue = playersInQueue.some(x => x === playerData.discordName);

        if (!isInQueue) {
            playersInQueue.push({
                discordName: playerData.discordName,
                discordid: playerData.discordid,
                ...playerData.val,
                rank: getRandomInt(0, valorantConfig.ranks.length) // For testing
            });
            response.message = "Added to queue";
        }
        else {
            response.error = true;
            response.message = "Already in queue";
        }
    }
    else {
        response.error = true;
        response.message = "Queue is not currently opened.";
    }

    return response;
}

function createMatch(message) {
    let attemptedMatches = 0;
    const matchInfo = {
        teams: [],
        map: valorantConfig.maps[getRandomInt(0, valorantConfig.maps.length)],
        response: "",
        hasError: false,
        hasFatalError: false
    }
    
    while (attemptedMatches < 5000) {
        attemptedMatches++;
        let queuedPlayers = [...playersInQueue];

        while (matchInfo.teams.length < valorantConfig.maxTeams) {
            matchInfo.teams.push({
                name: valorantConfig.teamNames[matchInfo.teams.length],
                players: [],
                teamRank: 0
            })
        }

        for (let i = 0; i < (valorantConfig.maxPlayersPerTeam * valorantConfig.maxTeams); i++) {
            const teamsNeedPlayers = matchInfo.teams.filter(team => team.players.length < valorantConfig.maxPlayersPerTeam);

            if (teamsNeedPlayers.length > 0) {
                const team = teamsNeedPlayers[getRandomInt(0, teamsNeedPlayers.length)];
                const player = queuedPlayers[getRandomInt(0, queuedPlayers.length)];
                queuedPlayers = queuedPlayers.filter(x => x !== player);

                team.players.push(player);
                team.teamRank += player.rank;
            }
        }

        const allTeamRanks = matchInfo.teams.map(x => x.teamRank);
        const rankDiff = Math.max(...allTeamRanks) - Math.min(...allTeamRanks);

        if (rankDiff < valorantConfig.maxTierDiff && rankDiff > -valorantConfig.maxTierDiff) {
            break;
        }
    }

    if (attemptedMatches >= 5000) {
        console.log(`Could make make teams within ${attemptedMatches}`);
        message.channel.send("Failed to create a suitable match");
    }
    else {
        console.log(`Created match after ${attemptedMatches} attempts`);
        const embeddedMessage = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle("Valorant Match")
        .setDescription(`Map: ${matchInfo.map}`)
    
        matchInfo.teams.forEach(team => {
            embeddedMessage.addField("\u200B", "\u200B", false)
            embeddedMessage.addField(`Team ${team.name}`, "RANK", false);
            embeddedMessage.addField(`Players:`, team.players.map(p => {
                const discord = p.discordid ? `<@${p.discordid}>` : p.discordName;
    
                return `${discord}\nVALORANT TAG\n${valorantConfig.ranks[p.rank]}`
            }).join("\n") || "None", true);
        })
    
        message.channel.send({ embed: embeddedMessage });
    }
}

module.exports = valorant;