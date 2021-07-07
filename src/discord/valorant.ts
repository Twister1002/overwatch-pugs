import { getAllPlayerData, getRandomInt, getPlayerDataByDiscordTag, addPlayer, removePlayer, getCommand } from "./utilities";
import valorantConfig from "../data/valorantconfig.json";
import { MessageEmbed } from "discord.js";

let playersInQueue: Array<{}> = [];
let canQueue = false;

export default function valorant(message, command, messageData) {
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
            const maps = valorantConfig.maps;

            message.channel.send(`Available Maps ${maps.length}\n${maps.map(x => `- ${x}`).join("\n")}`)
        }
            break;
        case "info": {
            let isReply = false;
            let response = "";
            let userTag = message.mentions.users.first() ? message.mentions.users.first().tag : message.author.tag;
            const playerData = getPlayerDataByDiscordTag(userTag)

            if (playerData.val) {
                if (message.author.tag === playerData.discordName) {
                    isReply = true;
                }

                response = `RiotTag: ${playerData.val.riotTag}; Rank: ${getRankName(playerData.val.rank)}`;
            }
            else {
                response = `No record exists for ${userTag}.`;
                if (message.author.tag === playerData.discordName) {
                    isReply = true;
                    const setCommand = getCommand("val", "set");
                    response += ` Please set your info using '!val ${setCommand.name} ${setCommand.args}'`;
                }
            }

            if (isReply) {
                message.reply(response);
            }
            else {
                message.channel.send(response);
            }
        }
            break;
        case "users": {
            const players = getAllPlayerData().filter(x => x.val);
            let response = `Users registered for Valorant: ${players.length}\n${players.map(x => `- ${x.discordName} (${x.val.riotTag})`).join("\n")}`;

            message.channel.send(response);
        }
            break;
        case "set": {
            const riotTag = messageData.shift().replace(/[<>]/g, "");
            let rank = messageData.shift();
            rank = valorantConfig.ranks.findIndex(r => r === rank.toLowerCase().replace(/[<>]/g, ""));

            const result = addPlayer(message.author, "val", {
                riotTag,
                rank
            });

            if (result) {
                message.delete().catch(e => console.log(e));
                message.reply(`your info has been saved: ${riotTag} at rank ${getRankName(rank)}`);
            }
            else {
                message.reply("Unable to save your info due to an error.");
            }
        }
            break;
        case "remove": {
            // if (removePlayer(message.author)) {
            //     message.reply("You have been removed from our system");
            // }
            // else { 
            //     message.reply("There was an error removing you from the system");
            // }
        }
            break;
        case "startmatch": {
            createMatch(message);
        }
            break;
        case "testmatch": {
            canQueue = true;
            const players = getAllPlayerData().filter(x => x.val);
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

        if (playerData.val) {
            if (!isInQueue) {
                playersInQueue.push({
                    discordName: playerData.discordName,
                    discordid: playerData.discordid,
                    ...playerData.val,
                    rank: playerData.val.rank
                });
                response.message = "Added to queue";
            }
            else {
                response.error = true;
                response.message = "Already in queue";
            }
        }
        else {
            const setCommand = getCommand("val", "set");
            response.message = `No record exists for ${discordUserTag}. Please set your info using '!val ${setCommand.name} ${setCommand.args}'`;
            response.error = true;
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
    const matchInfo: any = {
        teams: [],
        map: valorantConfig.maps[getRandomInt(0, valorantConfig.maps.length)],
        response: "",
        hasError: false,
        hasFatalError: false
    }

    // Do we have enough players in order to make the match?
    if (playersInQueue.length < (valorantConfig.maxTeams * valorantConfig.maxPlayersPerTeam)) {
        message.channel.send("There are not enough players to make a match.");
        return;
    }

    while (attemptedMatches < 5000) {
        attemptedMatches++;
        let queuedPlayers: Array<{}> = [...playersInQueue];

        while (matchInfo.teams.length < valorantConfig.maxTeams) {
            matchInfo.teams.push({
                name: valorantConfig.teamNames[matchInfo.teams.length],
                players: [],
                teamRank: 0,
                avgRank: function() {
                    return Math.floor(this.teamRank / this.players.length)
                },
                avgRankName: function () {
                    return getRankName(Math.floor(this.teamRank / this.players.length))
                }
            })
        }

        for (let i = 0; i < (valorantConfig.maxPlayersPerTeam * valorantConfig.maxTeams); i++) {
            const teamsNeedPlayers = matchInfo.teams.filter(team => team.players.length < valorantConfig.maxPlayersPerTeam);

            if (teamsNeedPlayers.length > 0 && queuedPlayers.length > 0) {
                const team = teamsNeedPlayers[getRandomInt(0, teamsNeedPlayers.length)];
                const player: {[k: string]: any} = queuedPlayers[getRandomInt(0, queuedPlayers.length)];
                queuedPlayers = queuedPlayers.filter(x => x !== player);

                team.players.push(player);
                team.teamRank += player.rank;
            }
            else {
                break;
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
        .addField("\u200B", "\u200B", false);

        matchInfo.teams.forEach(team => {
            embeddedMessage.addField(`${team.name}}`, team.players.map(p => {
                const discord = false ? `<@${p.discordid}>` : p.discordName;
                return `${discord}\n${p.riotTag}\n${getRankName(p.rank)}\n`
            }).join("\n") || "None", true);
        })
    
        message.channel.send({ embed: embeddedMessage });
    }
}

function getRankName(rank) {
    return valorantConfig.ranks[rank];
}

module.exports = valorant;