import { User } from "discord.js";
import fs from "fs";
import path from "path";
import commands from "../data/commands.json";
import modPermissions from "../data/permissions.json";

//The maximum is exclusive and the minimum is inclusive
export function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
}

export function parseToNumber(data: string): number {
    const regex = new RegExp(/[0-9]/g);
    const stringMatch = data.match(regex) ? data.match(regex)?.join("") ?? 0 : 0;
    const SRValue = Number(stringMatch)

    return SRValue;
}

export function getSRTier(sr: number): OverwatchTier {
    let tier: OverwatchTier;
    if (sr < 1500) {
        // Bronze
        tier = "B";
    }
    else if (sr >= 1500 && sr < 2000) {
        // Silver
        tier = "S";
    }
    else if (sr >= 2000 && sr < 2500) {
        // Gold
        tier = "G";
    }
    else if (sr >= 2500 && sr < 3000) {
        // Plat
        tier = "P";
    }
    else if (sr >= 3000 && sr < 3500) {
        // Masters
        tier = "D";
    }
    else if(sr >= 3500 && sr < 4000) {
        tier = "M";
    }
    else {
        // GM
        tier = "GM";
    }

    return tier;
}

// export async function findUserInGuild(guild, discordUserId: string) {
//     let user = undefined;

//     if (!Number.isNaN(discordUserId) && discordUserId) {
//         user = guild.members.cache.find(u => discordUserId === u.user.id);

//         if (!user) {
//             // Find the user 
//             user = guild.members.fetch(discordUserId);
//         }
//     }

//     return user;
// }

export function loadFile(fileName: string): object {
    const filePath = path.join(__dirname, "../", "data", fileName);
    let fileData;

    if (fs.existsSync(filePath)) {
        fileData = fs.readFileSync(filePath);
        const isJSON = fileName.substr(fileName.lastIndexOf(".")).toLowerCase().includes("json") ? true : false;

        if (isJSON) {
            fileData = JSON.parse(fileData);
        }
    }

    return fileData;
}

export function saveFile(fileName: string, data: object): boolean {
    const filePath = path.join(__dirname, "../", "data", fileName);

    try {
        fs.writeFileSync(filePath, JSON.stringify(data));
        return true;
    }
    catch (err) {
        console.error(err);
        return false;
    }
}

export function getCommands(main: string): Array<Command> {
    if (commands[main]) {
        return commands[main];
    }
    else {
        return [];
    }
}

export function getCommand(main: string, sub?: string): Command | undefined {
    const mainCommands = getCommands(main);
    let command: Command | undefined; 

    if (mainCommands.length > 0) {
        command = mainCommands.find(x => sub === x.name);
    }
    
    return command;
}

export function isUserMod(discordUser): boolean {
    return discordUser.roles.cache.some(r => modPermissions.some(m => m.id === r.id));
}

export function getAllPlayerData(): Array<Player> {
    const pugData = loadFile("playerdata.json") as Array<Player>

    return pugData;
}

export function getPlayerDataByDiscordTag(discordName): Player | undefined {
    return getAllPlayerData().find(p => p.discordName === discordName);
}

export function addPlayer(discordUser: User, game: string, data: OverwatchPlayerData | ValorantPlayerData): boolean {
    const allPlayerData = getAllPlayerData();
    let playerData = allPlayerData.find(x => x.discordName === discordUser.tag);

    if (playerData) {
        playerData.discordid = discordUser.id;

        playerData[game] = {
            ...playerData[game],
            ...data
        }

        console.log(`Updating player ${playerData.discordName}`)
    }
    else {
        playerData = {
            discordName: discordUser.tag,
            discordid: discordUser.id,
            [game]: {
                ...data
            }
        };
        allPlayerData.push(playerData);

        console.log(`Adding player ${playerData.discordName}`)
    }

    return saveFile("playerdata.json", allPlayerData);
}

export function removePlayer(discordUser: User): boolean {
    // Check by discord ID

    // Check by tag name
    const allPlayerData = getAllPlayerData().filter(x => x.discordName !== discordUser.tag);

    return saveFile("playerdata.json", allPlayerData);
}