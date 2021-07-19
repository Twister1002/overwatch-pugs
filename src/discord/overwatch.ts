import { DMChannel, Message, MessageEmbed, NewsChannel, TextChannel, User } from "discord.js";
import { 
    parseToNumber,
    getSRTier,
    getCommand,
    getPlayerDataByDiscordTag,
    getAllPlayerData,
    addPlayer, 
    isValidPlayerTag
} from "./utilities";
import { createOverWatchMatch, setMatchConfig, getMatchConfig } from "./match";
import overwatchConfig from "../data/overwatchconfig.json";

let allowQueue = false;
let playersInQueue: Array<OverwatchQueuedPlayer> = [];

export default function overwatch(message: Message, command: Command, messageData: Array<string>) {
    let response: string = "";
    let isReply: boolean = false;
    let deleteMessage: boolean = false;

    switch (command.name) {
        case "info": {
            let taggedUser: User = message.mentions.users.first() || message.author;
            const playerData: Player | undefined = getPlayerDataByDiscordTag(taggedUser.tag)

            if (playerData && playerData.ow) {
                if (message.author.tag === playerData.discordName) {
                    isReply = true;
                }

                response = `BTag: ${playerData.ow.btag};`;
                response +=  playerData.ow.tank ? ` Tank: ${playerData.ow.tank};` : ``;
                response +=  playerData.ow.dps ? ` DPS: ${playerData.ow.dps};` : ``;
                response +=  playerData.ow.support ? ` Support: ${playerData.ow.support}` : ``;
            }
            else {
                response = `No record exists for ${taggedUser}.`;

                if (taggedUser.tag === playerData?.discordName) {
                    isReply = true;
                    const setCommand: Command | undefined = getCommand("set");
                    response += ` Please set your info using '!ow ${setCommand?.name} ${setCommand?.args.ow}'`;
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

            const bTagInfo: string = btagIndex > -1 ? messageData[btagIndex + 1].replace(/[<>]/g, "") : "";
            const tankRank: number = tankIndex > -1 ? parseToNumber(messageData[tankIndex + 1]) : 0;
            const supportRank: number = supportIndex > -1 ? parseToNumber(messageData[supportIndex + 1]) : 0;
            const dpsRank: number = dpsIndex > -1 ? parseToNumber(messageData[dpsIndex + 1]) : 0;

            if (isValidPlayerTag(bTagInfo)) {
                const dataToSave: OverwatchPlayerData = {} as OverwatchPlayerData;
                if (bTagInfo) { dataToSave.btag = bTagInfo; }
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
                }
                else {
                    console.log("Error in saving user data");
                    response = "Failed to save data";
                }
            }
            else {
                deleteMessage = false;
                response = "You must provide your hashtag and numbers";
            }
        }
            break;
        case "startq": {
            playersInQueue = [];
            allowQueue = true;
            const commandInfo = getCommand("q");

            response = `Queue has been opened.\nTo queue for a role, please use \`!ow ${commandInfo?.name} ${commandInfo?.args.ow}\`.`;
        } 
        break;
        case "stopq": {
            allowQueue = false;
            response = "Queue has been closed";
        }
            break;
        case "quser": {
            deleteMessage = true;
            const playerToQueue: User | undefined = message.mentions.users.first();
            messageData.shift(); // This is only needed to remove the tag

            if (playerToQueue) {
                isReply = false;
                response = addPlayerToQueue(playerToQueue, messageData as Array<OverwatchRole>);
                response = `<@${playerToQueue}> ` + response;
            }
            else {
                isReply = true;
                response = "You need mention the user to queue them."
            }
        }
            break;
        case "q": {
            response = addPlayerToQueue(message.author, messageData as Array<OverwatchRole>);
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
            createMatch(message.channel);
        }
            break;
        case "maps": {
            // Display all map's name
            overwatchConfig.maps.forEach(m => response += `- ${m}\n`)
        }
            break;
            break;
        case "testmatch": {
            const testPlayerData = getAllPlayerData().filter(x => x.ow);

            allowQueue = true;
            // testPlayerData.forEach(p => addPlayerToQueue(p, ["all"]))

            // Test case for invalid match and could not be created.
            const playersToTest = [
                { discordName: "Jesus Christ#1216", queue: ["tank", "dps"] },
                { discordName: "Skateking-#7517", queue: ["dps"] },
                { discordName: "Sparlin#3892", queue: ["all"] },
                { discordName: "Arkonon#5896", queue: ["all"] },
                { discordName: "Edant#3834", queue: ["support"] },
                { discordName: "Sen#4444", queue: ["dps", "tank"] },
                { discordName: "Flowingfiber#8311", queue: ["dps","support"] },
                { discordName: "Sirloin77#4166", queue: ["all"] },
                { discordName: "Rain#0006", queue: ["all"] },
                { discordName: "!Spoodini#9821", queue: ["dps"] },
                { discordName: "Slim_and_Shady#5291", queue: ["tank","dps"] },
                { discordName: "Nanybanany#3765", queue: ["support"] },
            ]

            playersToTest.forEach(p => {
                addPlayerToQueue(testPlayerData.find(pl => p.discordName === pl.discordName) as Player, p.queue as Array<OverwatchRole>);
            })
            
            allowQueue = false;

            createMatch(message.channel);
        }
            break;
        case "setup": {
            const settings: OverwatchConfig = {} as OverwatchConfig;

            if (messageData.length > 0) {
                while (messageData.length > 0) {
                    const setting: string | undefined = messageData.shift();
                    const value: string = messageData.shift() || "";

                    if (setting && settings[setting]) {

                        settings[setting] = Number.isNaN(parseInt(value)) ? value : Number(value);
                    }
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
            response = `No record exists for ${player?.discordName}. Please set your info using '!ow ${setCommand?.name} ${setCommand?.args.ow}'`;
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
                    embeddedMessage.addField(`Tanks:`, team.tank.map(x => `${(false ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow?.btag}\n${x.ow?.tank} - ${getSRTier(x.ow?.tank as number)}\n`).join("\n") || "None", true)
                    embeddedMessage.addField(`DPS:`, team.dps.map(x => `${(false ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow?.btag}\n${x.ow?.dps} - ${getSRTier(x.ow?.dps as number)}\n`).join("\n") || "None", true)
                    embeddedMessage.addField(`Supports:`, team.support.map(x => `${(false ? `<@${x.discordid}>` : `${x.discordName}`)}\n${x.ow?.btag}\n${x.ow?.support} - ${getSRTier(x.ow?.support as number)}\n`).join("\n") || "None", true)
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

function sendMessageToServer(message: Message, response: string, isReply: boolean = false, deleteMessage: boolean = false) {
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