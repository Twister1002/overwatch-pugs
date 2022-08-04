import { DMChannel, Message, MessageEmbed, NewsChannel, TextChannel, User } from "discord.js";
import { 
    parseToNumber,
    getSRTier,
    getCommand,
    getPlayerDataByDiscordTag,
    getAllPlayerData,
    addPlayer, 
    isValidPlayerTag,
    getRandomInt
} from "./utilities";
import { createOverWatchMatch, setMatchConfig, getMatchConfig } from "./match";
import overwatchConfig from "../data/overwatchconfig.json";
const isDev: boolean = process.env.NODE_ENV === "development";

let allowQueue = false;
let playersInQueue: Array<OverwatchQueuedPlayer> = [];

export default function overwatch(message: Message, command: Command, messageData: Array<string>) {
    let response: string = "";

    switch (command.name) {
        case "info": {
            let shouldReply: boolean = false;
            let taggedUser: User = message.mentions.users.first() || message.author;
            const playerData: Player | undefined = getPlayerDataByDiscordTag(taggedUser.tag)

            if (playerData && playerData.ow) {
                if (message.author.tag === playerData.discordName) {
                    shouldReply = true;
                }

                response = `BTag: ${playerData.ow.btag};`;
                response +=  playerData.ow.tank ? ` Tank: ${playerData.ow.tank};` : ``;
                response +=  playerData.ow.dps ? ` DPS: ${playerData.ow.dps};` : ``;
                response +=  playerData.ow.support ? ` Support: ${playerData.ow.support}` : ``;
            }
            else {
                response = `No record exists for <@${taggedUser.id}>.`;

                if (taggedUser.tag === playerData?.discordName) {
                    shouldReply = true;
                    const setCommand: Command | undefined = getCommand("set");
                    response += ` Please set your info using '.${setCommand?.name} ${setCommand?.args.ow}'`;
                }
            }

            shouldReply ? message.reply(response) : message.channel.send(response);
        }
            break;
        case "set": {
            // Need to find a new way to handle parameters
            const btagIndex = messageData.findIndex(p => p.toLowerCase().includes("btag"));
            const supportIndex = messageData.findIndex(p => p.toLowerCase().includes("support"));
            const dpsIndex = messageData.findIndex(p => p.toLowerCase().includes("dps"));
            const tankIndex = messageData.findIndex(p => p.toLowerCase().includes("tank"));

            const bTagInfo: string = btagIndex > -1 ? messageData[btagIndex + 1].replace(/[<>]/g, "") : "";
            const tankRank: number = tankIndex > -1 ? parseToNumber(messageData[tankIndex + 1]) : 0;
            const supportRank: number = supportIndex > -1 ? parseToNumber(messageData[supportIndex + 1]) : 0;
            const dpsRank: number = dpsIndex > -1 ? parseToNumber(messageData[dpsIndex + 1]) : 0;
            const dataToSave: OverwatchPlayerData = {} as OverwatchPlayerData;

            if (isValidPlayerTag(bTagInfo)) {
                if (bTagInfo) { dataToSave.btag = bTagInfo; }
            }

            if (tankRank > 500) { dataToSave.tank = tankRank; }
            if (supportRank > 500) { dataToSave.support = supportRank; }
            if (dpsRank > 500) { dataToSave.dps = dpsRank; }
            const isSaved = addPlayer(message.author, "ow", dataToSave)

            if (isSaved) {
                const playerData: OverwatchPlayerData | undefined = getPlayerDataByDiscordTag(message.author)?.ow;
                
                if (playerData) {
                    response =  playerData.btag ? `Battle Tag: ${playerData.btag};` : ``;
                    response +=  playerData.tank ? ` Tank: ${playerData.tank};` : ``;
                    response +=  playerData.dps ? ` DPS: ${playerData.dps};` : ``;
                    response +=  playerData.support ? ` Support: ${playerData.support}` : ``;
                }

                message.delete();
            }
            else {
                console.log("Error in saving user data");
                response = "Failed to save data";
            }

            message.reply(response);
        }
            break;
        case "startq": {
            playersInQueue = [];
            allowQueue = true;
            const commandInfo = getCommand("q");

            response = `Queue has been opened.\nTo queue for a role, please use \`.${commandInfo?.name} ${commandInfo?.args.ow}\`.`;
            message.channel.send(response);
        } 
        break;
        case "stopq": {
            allowQueue = false;
            response = "Queue has been closed";
            message.channel.send(response);
        }
            break;
        case "quser": {
            const playerToQueue: User | undefined = message.mentions.users.first();
            messageData.shift(); // This is only needed to remove the tag

            if (playerToQueue) {
                response = addPlayerToQueue(playerToQueue, messageData as Array<OverwatchRole>);
                response = `<@${playerToQueue}> ` + response;
                message.delete().then(x => x.channel.send(response));
            }
            else {
                response = "You need mention the user to queue them."
                message.reply(response);
            }
        }
            break;
        case "q": {
            response = addPlayerToQueue(message.author, messageData as Array<OverwatchRole>);
            message.delete().then(x => x.reply(response));
        }
            break;
        case "unq": {
            const players = [...playersInQueue.filter(p => p.discordName !== message.author.tag)];
            playersInQueue = players;
            message.delete().then(x => x.reply("You have been removed from queue"));
        }
            break;
        case "lobby": {
            response = `${playersInQueue.length} players in queue:\n${playersInQueue.map(x => `- ${x.discordName} (${x.queue.join(",")})`).join("\n")}`;
            message.channel.send(response);
        }
            break;
        case "startmatch": {
            createMatch(message.channel);
        }
            break;
        case "maps": {
            // Display all map's name
            response = overwatchConfig.maps.map(m => `- ${m}`).join("\n");
            message.channel.send(response);
        }
            break;
        case "testmatch": {
            const testPlayerData = getAllPlayerData().filter(x => x.ow);

            allowQueue = true;
            testPlayerData.forEach(p => addPlayerToQueue(p, ["all"]))

            // Test case for invalid match and could not be created.
            // const playersToTest = [
            //     { discordName: "Jesus Christ#1216", queue: ["tank", "dps"] },
            //     { discordName: "Skateking-#7517", queue: ["dps"] },
            //     { discordName: "Sparlin#3892", queue: ["all"] },
            //     { discordName: "Arkonon#5896", queue: ["all"] },
            //     { discordName: "Edant#3834", queue: ["support"] },
            //     { discordName: "Sen#4444", queue: ["dps", "tank"] },
            //     { discordName: "Flowingfiber#8311", queue: ["dps","support"] },
            //     { discordName: "Sirloin77#4166", queue: ["all"] },
            //     { discordName: "Rain#0006", queue: ["all"] },
            //     { discordName: "!Spoodini#9821", queue: ["dps"] },
            //     { discordName: "Slim_and_Shady#5291", queue: ["tank","dps"] },
            //     { discordName: "Nanybanany#3765", queue: ["support"] },
            // ]

            // playersToTest.forEach(p => {
            //     addPlayerToQueue(testPlayerData.find(pl => p.discordName === pl.discordName) as Player, p.queue as Array<OverwatchRole>);
            // })
            
            allowQueue = false;

            createMatch(message.channel);
        }
            break;
        case "setup": {
            const settings: {[k: string]: any} = {};

            if (messageData.length > 0) {
                while (messageData.length > 0) {
                    const settingKey: string | undefined = messageData.shift();
                    const value: string = messageData.shift() || "";

                    if (settingKey) {
                        settings[settingKey] = Number.isNaN(parseInt(value)) ? value : Number(value);
                    }
                }

                response = setMatchConfig(settings);
            }
            else {
                const updatedSettings = getMatchConfig();

                response = JSON.stringify(updatedSettings, (key, value) => (value || ''), 4).replace(/"([^"]+)":/g, '$1:');
            }

            message.channel.send(response);
        }
            break;
        case "roulette": {
            const classType: string | undefined = messageData.shift();
            if (classType) {
                const random: number = getRandomInt(0, overwatchConfig[classType.toLowerCase()].length);
                const randomCharacter = overwatchConfig[classType.toLowerCase()][random];
                response = `${randomCharacter} has chosen you...`;
            }
            else {
                response = `Invalid class type: ${classType}`
            }

            message.channel.send(response);
        }
            break;
    }
}

function addPlayerToQueue(discordUser: User | Player, roles: Array<OverwatchRole>) {
    let response = "";
    const player: Player | undefined = discordUser instanceof User ? getPlayerDataByDiscordTag(discordUser.tag) : discordUser;

    if (allowQueue) {
        if (player && player.ow) {
            const wantedRoles: Array<OverwatchRole> = roles.includes("all") ? overwatchConfig.roles.map<OverwatchRole>(x => x.name as OverwatchRole) : roles;
            const filteredRoles: Array<OverwatchRole> = wantedRoles.filter(r => {
                if (player.ow) {
                    return player.ow[r.toLowerCase()] >= 500
                }
            })
            .map(r => r.toLowerCase()) as Array<OverwatchRole>;

            if (roles.length > 0) {
                if (filteredRoles.length > 0) {
                    const inQueue = playersInQueue.filter(q => q.discordName !== player.discordName);
                    inQueue.push({
                        ...player,
                        queue: filteredRoles
                    })

                    playersInQueue = inQueue;
                    response = `is queued for ${filteredRoles.join(", ")}.`
                }
                else {
                    response = `You may not attempt to queue with no ranks in range.`
                }
            }
            else {
                response = "You must provide a role to queue for."
            }
        }
        else {
            const setCommand = getCommand("set");
            response = `No record exists for ${discordUser instanceof User ? discordUser.username : ""}. Please set your info using '.${setCommand?.name} ${setCommand?.args.ow}'`;
        }
    }
    else {
        response = "The queue for Overwatch is not currently not accepting new applications."
    }

    return response;
}

function createMatch(channel: TextChannel | DMChannel | NewsChannel): void {
    if (!allowQueue) {
        let createdMatches: Array<OverwatchMatch> = [];
        let bestMatch: OverwatchMatch | undefined;

        try {
            while (createdMatches.length < 5000) {
                let lastCreatedMatch: OverwatchMatch | undefined = createOverWatchMatch([...playersInQueue]);
                createdMatches.push(lastCreatedMatch);

                if (!lastCreatedMatch.hasError) {
                    // No error found when creating the last match. Use it.
                    bestMatch = lastCreatedMatch;
                    break;
                }
            }

            // If a match was not best suited, then find the closest!
            if (!bestMatch) {
                const owConfig = getMatchConfig();
                bestMatch = createdMatches.filter(m => {
                    const playersOnTeam: Array<number> = m.teams.map(x => x.players.length);
                    if (playersOnTeam.every(x => x === owConfig.maxPlayersOnTeam)) {
                        return m;
                    }
                })
                .sort((a, b) => a.getSRDiff() - b.getSRDiff())[0];

                console.log(`After ${createdMatches.length} matches the best match will be used:`)
                console.log(bestMatch);
            }

            if (bestMatch) {
                // Display the match... or the closest match
                const embeddedMessage: MessageEmbed = new MessageEmbed()
                .setColor("#0099ff")
                .setTitle("Overwatch Match")
                .setDescription(`Map: ${bestMatch.map}`)

                bestMatch.teams.forEach((team) => {
                    embeddedMessage.addField("\u200B", "\u200B", false)
                    embeddedMessage.addField(`Team ${team.name}`, team.avgSR(), false);
                    embeddedMessage.addField(`Tanks:`, team.tank.map(x => `${(x.discordid && !isDev ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow?.btag}\n${x.ow?.tank} - ${getSRTier(x.ow?.tank as number)}\n`).join("\n") || "None", true)
                    embeddedMessage.addField(`DPS:`, team.dps.map(x => `${(x.discordid && !isDev ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow?.btag}\n${x.ow?.dps} - ${getSRTier(x.ow?.dps as number)}\n`).join("\n") || "None", true)
                    embeddedMessage.addField(`Supports:`, team.support.map(x => `${(x.discordid && !isDev ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow?.btag}\n${x.ow?.support} - ${getSRTier(x.ow?.support as number)}\n`).join("\n") || "None", true)
                })

                console.log(`Created match after ${createdMatches.length} attempts`)
                channel.send({ embed: embeddedMessage });
            }
            else {
                console.log(`There is not a best match that could be found...`)
                channel.send(`No match is available within the current settings. Please requeue.`)
            }
        }
        catch (e: any) {
            channel.send(`A fatal error has occured: ${e.message}`)
            console.error(e.message);
        }
    }
    else {
        channel.send("Queue must be closed to start a match.");
    }
}

module.exports = overwatch;