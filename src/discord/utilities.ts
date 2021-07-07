import fs from "fs";
import path from "path";
import commands from "../data/commands.json";
import modPermissions from "../data/permissions.json";

//The maximum is exclusive and the minimum is inclusive
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
}

export function parseToNumber(data) {
    const regex = new RegExp(/[0-9]/g);
    const stringMatch = data.match(regex) ? data.match(regex).join("") : 0;
    const SRValue = Number(stringMatch)

    return SRValue;
}

export function getSRTier(sr) {
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

export async function findUserInGuild(guild, discordUserId) {
    let user = undefined;

    if (!Number.isNaN(discordUserId) && discordUserId) {
        user = guild.members.cache.find(u => discordUserId === u.user.id);

        if (!user) {
            // Find the user 
            user = guild.members.fetch(discordUserId);
        }
    }

    return user;
}

export function loadFile(fileName) {
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

export function saveFile(fileName, data) {
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

export function getCommands(main) {
    if (commands[main]) {
        return commands[main];
    }
    else {
        return [];
    }
}

export function getCommand(main, sub) {
    const mainCommands = getCommands(main);

    if (mainCommands.length > 0) {
        return mainCommands.find(x => sub === x.name);
    }
    else {
        return [];
    }
}

export function isUserMod(discordUser) {
    return discordUser.roles.cache.some(r => modPermissions.some(m => m.id === r.id));
}

export function getAllPlayerData() {
    const pugData = loadFile("playerdata.json");

    return pugData;
}

export function getPlayerDataByDiscordTag(discordName) {
    return getAllPlayerData().find(p => p.discordName === discordName);
}

export function addPlayer(discordUser, game, data) {
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

export function removePlayer(discordUser) {
    const allPlayerData = getAllPlayerData().filter(x => x.discordName !== discordUser.tag);

    return saveFile("playerdata.json", allPlayerData);
}