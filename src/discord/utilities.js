const fs = require("fs");
const path = require("path");
const commands = require("../data/commands.json");
const modPermissions = require("../data/permissions.json");

//The maximum is exclusive and the minimum is inclusive
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
}

function parseToNumber(data) {
    const regex = new RegExp(/[0-9]/g);
    const stringMatch = data.match(regex) ? data.match(regex).join("") : 0;
    const SRValue = Number(stringMatch)

    return SRValue;
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

async function findUserInGuild(guild, discordUserId) {
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

    try {
        fs.writeFileSync(filePath, JSON.stringify(data));
        return true;
    }
    catch (err) {
        console.error(err);
        return false;
    }
}

function getCommands(main) {
    if (commands[main]) {
        return commands[main];
    }
    else {
        return [];
    }
}

function getCommand(main, sub) {
    const mainCommands = getCommands(main);

    if (mainCommands.length > 0) {
        return mainCommands.find(x => sub === x.name);
    }
    else {
        return [];
    }
}

function isUserMod(discordUser) {
    return discordUser.roles.cache.some(r => modPermissions.some(m => m.id === r.id));
}

function getAllPlayerData() {
    const pugData = loadFile("playerdata.json");

    return pugData;
}

function getPlayerDataByDiscordTag(discordName) {
    return getAllPlayerData().find(p => p.discordName === discordName);
}

module.exports = {
    getRandomInt,
    parseToNumber,
    getSRTier,
    findUserInGuild,
    saveFile,
    loadFile,
    getCommands,
    getCommand,
    isUserMod,
    getAllPlayerData,
    getPlayerDataByDiscordTag
}