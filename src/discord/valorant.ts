import { 
    getAllPlayerData, 
    getRandomInt, 
    getPlayerDataByDiscordTag, 
    addPlayer, 
    removePlayer, 
    getCommand, 
    isValidPlayerTag 
} from "./utilities";
import valorantConfig from "../data/valorantconfig.json";
import { Message, MessageEmbed, User } from "discord.js";

let playersInQueue: Array<Player> = [];
let canQueue = false;
const config: ValorantConfig = valorantConfig;

export default function valorant(message: Message, command: Command, messageData: Array<string>) {
    switch (command.name) {
        case "startq": {
            canQueue = true;
            playersInQueue = [];
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
            playersInQueue = [...playersInQueue.filter(x => x.discordName !== message.author.tag)];
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
            let response = `${playersInQueue.length} players in queue:\n${playersInQueue.map(p => p.discordName).join("\n")}`;

            message.channel.send(response);
        }
            break;
        case "maps": {
            const maps = config.maps;

            message.channel.send(`Available Maps ${maps.length}\n${maps.map(x => `- ${x}`).join("\n")}`)
        }
            break;
        case "info": {
            let isReply = false;
            let response = "";
            const user: User = message.mentions.users.first() || message.author;
            const playerData = getPlayerDataByDiscordTag(user);

            if (playerData?.val) {
                if (user.tag === playerData.discordName) {
                    isReply = true;
                }

                response = `RiotTag: ${playerData.val.riotTag}; Rank: ${getRankName(playerData.val.rank)}`;
            }
            else {
                response = `No record exists for ${user.tag}.`;

                if (user.tag === playerData?.discordName) {
                    isReply = true;
                    const setCommand: Command | undefined = getCommand("set");

                    if (setCommand) {
                        response += ` Please set your info using '!val ${setCommand.name} ${setCommand.args.val}'`;
                    }
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
        case "set": {
            const riotTag: string | undefined = messageData.shift()?.replace(/[<>]/g, "") || "";
            const rankString: string | undefined = messageData.shift();
            let rank: number = config.ranks.findIndex(r => r === rankString?.toLowerCase().replace(/[<>]/g, "")) || -1;

            if (isValidPlayerTag(riotTag)) {
                const result = addPlayer(message.author, "val", {
                    riotTag,
                    rank
                });

                if (result) {
                    message
                    .delete()
                    .then(m => m.reply(`your info has been saved: ${riotTag} at rank ${getRankName(rank)}`))
                    .catch(e => console.log(e));
                }
                else {
                    message.reply("Unable to save your info due to an error.");
                }
            }
            else {
                message.reply("You must provide your hashtag and numbers");
            }
        }
            break;
        case "startmatch": {
            createMatch(message);
        }
            break;
        case "testmatch": {
            canQueue = true;
            const players: Array<Player> = getAllPlayerData().filter(x => x.val);
            players.forEach(x => addPlayerToQueue(x.discordName));
            canQueue = false;

            createMatch(message);
        }
            break;
    }
}

function addPlayerToQueue(discordTag: string): {message: string, error: boolean} {
    const response = {
        error: false,
        message: ""
    };

    if (canQueue) {
        const playerData: Player | undefined = getPlayerDataByDiscordTag(discordTag);

        if (playerData && playerData.val) {
            const isInQueue = playersInQueue.some(x => x.discordName === playerData.discordName);

            if (!isInQueue) {
                playersInQueue.push(playerData);
                response.message = "Added to queue";
            }
            else {
                response.error = true;
                response.message = "Already in queue";
            }
        }
        else {
            const setCommand = getCommand("set");
            response.message = `No record exists for ${discordTag}. Please set your info using '!val ${setCommand?.name} ${setCommand?.args.val}'`;
            response.error = true;
        }
    }
    else {
        response.error = true;
        response.message = "Queue is not currently opened.";
    }

    return response;
}

function createMatch(message: Message): void {
    let attemptedMatches = 0;
    const matchInfo: ValorantMatch = {
        teams: [],
        map: config.maps[getRandomInt(0, config.maps.length)],
        response: "",
        hasError: false,
        hasFatalError: false
    }

    // Do we have enough players in order to make the match?
    if (playersInQueue.length < (config.maxTeams * config.maxPlayersPerTeam)) {
        message.channel.send("There are not enough players to make a match.");
        return;
    }

    while (attemptedMatches < 5000) {
        attemptedMatches++;
        let queuedPlayers: Array<Player> = [...playersInQueue];

        while (matchInfo.teams.length < config.maxTeams) {
            matchInfo.teams.push({
                name: config.teamNames[matchInfo.teams.length],
                players: [],
                teamRank: 0,
                avgRank: function() {
                    return Math.floor(this.teamRank / this.players.length)
                },
                avgRankName: function (): ValorantRank {
                    return getRankName(Math.floor(this.teamRank / this.players.length))
                }
            } as ValorantTeam)
        }

        for (let i = 0; i < (config.maxPlayersPerTeam * config.maxTeams); i++) {
            const teamsNeedPlayers = matchInfo.teams.filter(team => team.players.length < config.maxPlayersPerTeam);

            if (teamsNeedPlayers.length > 0 && queuedPlayers.length > 0) {
                const team = teamsNeedPlayers[getRandomInt(0, teamsNeedPlayers.length)];
                const player: Player = queuedPlayers[getRandomInt(0, queuedPlayers.length)];
                queuedPlayers = queuedPlayers.filter(x => x.val?.riotTag !== player.val?.riotTag);

                team.players.push(player);
                team.teamRank += player.val ? player.val.rank : 0
            }
            else {
                break;
            }
        }

        const allTeamRanks = matchInfo.teams.map(x => x.teamRank);
        const rankDiff = Math.max(...allTeamRanks) - Math.min(...allTeamRanks);

        if (rankDiff < config.maxTierDiff && rankDiff > -config.maxTierDiff) {
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
            embeddedMessage.addField(`${team.name}`, team.players.map(p => {
                const discord = false ? `<@${p.discordid}>` : p.discordName;
                return `${discord}\n${p.val?.riotTag}\n${getRankName(p.val?.rank as number)}\n`
            }).join("\n") || "None", true);
        })
    
        message.channel.send({ embed: embeddedMessage });
    }
}

function getRankName(rank: number): ValorantRank {
    return config.ranks[rank] as ValorantRank;
}

module.exports = valorant;