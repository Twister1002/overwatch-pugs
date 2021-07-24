import { User } from "discord.js";
import fs from "fs";
import path from "path";
import dateTime from "../classes/DateTime";
import commands from "../data/commands.json";
import modPermissions from "../data/permissions.json";
import { LogType } from "../enums/LogType";


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
        tier = "Bronze";
    }
    else if (sr >= 1500 && sr < 2000) {
        // Silver
        tier = "Silver";
    }
    else if (sr >= 2000 && sr < 2500) {
        // Gold
        tier = "Gold";
    }
    else if (sr >= 2500 && sr < 3000) {
        // Platinum
        tier = "Platinum";
    }
    else if (sr >= 3000 && sr < 3500) {
        // Diamond
        tier = "Diamond";
    }
    else if(sr >= 3500 && sr < 4000) {
        // Master
        tier = "Master";
    }
    else {
        // GM
        tier = "Grand Master";
    }

    return tier;
}

export function loadFile(fileName: string): object {
    const filePath = path.join(__dirname, "../", "../", fileName);
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
    const filePath = path.join(__dirname, "../", "../", fileName);

    try {
        fs.writeFileSync(filePath, JSON.stringify(data));
        return true;
    }
    catch (err) {
        console.error(err);
        return false;
    }
}

export function logData(logType: LogType, message: string) {
    const date = dateTime("m/d/Y");
    const time = dateTime("H:i:s");
    const logName = `${date.replace(/\//g, "")}.log`;
    const messageToWrite = `(${date} ${time}) ${LogType[logType]}: ${message}`
    const filePath = path.join(__dirname, "../", "../", "logs", logName)
    const fileDir: string = path.dirname(filePath);

    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir);
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFile(filePath, messageToWrite, (err) => {
            if (err) throw err;
        });
    }
    else {
        fs.appendFile(filePath, `\n${messageToWrite}`, (err) => {
            if (err) throw err;
        });
    }
}

export function getDate(): string {
    const dateObj: Date = new Date();
    const month: string = (dateObj.getMonth()+1).toString().padStart(2, "0");
    const day: string = dateObj.getDate().toString().padStart(2, "0");
    const year: string = dateObj.getFullYear().toString().padStart(4, "0");

    return `${month} ${day} ${year}`;
}

export function getTime(): string {
    const dateObj: Date = new Date();
    const hours: string = dateObj.getHours().toString().padStart(2, "0");
    const minutes: string = dateObj.getMinutes().toString().padStart(2, "0");
    const seconds: string = dateObj.getSeconds().toString().padStart(2, "0");

    return `${hours} ${minutes} ${seconds}`
}

export function getCommands(includeAdmin: boolean): Array<Command> {
    const allCommands = includeAdmin ? commands : commands.filter(x => !x.isModCommand);
    return allCommands.sort((a, b) => (+a.isModCommand - +b.isModCommand));
}

export function getCommand(commandName: string): Command | undefined {
    const command = commands.find(x => commandName === x.name);
    return command;
}

export function isUserMod(discordUser): boolean {
    return discordUser.roles.cache.some(r => modPermissions.some(m => m.id === r.id));
}

export function getAllPlayerData(): Array<Player> {
    const pugData = loadFile("playerdata.json") as Array<Player>

    return pugData;
}

export function getPlayerDataByDiscordTag(discordUser: User | string): Player | undefined {
    const tag =  discordUser instanceof User ? discordUser.tag : <string>discordUser;

    return getAllPlayerData().find(p => p.discordName === tag);
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
    const allPlayerData = getAllPlayerData().filter(x => x.discordName !== discordUser.tag);

    return saveFile("playerdata.json", allPlayerData);
}

/**
 * Checks a string provided for the hashtag
 * @param tag A string of the tag gamer tag
 * @returns True if we can identify a HashTag and at least 2 numbers
 */
export function isValidPlayerTag(tag: string): boolean {
    let isValid = false;
    const hashIndex = tag.indexOf("#");

    if (hashIndex > -1) {
        // Check for at least 2 numbers
        const tagName = tag.substr(hashIndex + 1);

        if (tagName.length > 2) {
            isValid = true;
        }
    }
    
    return isValid;
}

export function toProperCase(val: string): string {
    return val.split(" ").map(x => x.substr(0, 1).toUpperCase() + x.substr(1).toLowerCase()).join(" ");
}