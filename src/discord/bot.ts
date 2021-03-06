require("dotenv").config();
import overwatch from "./overwatch";
import valorant from "./valorant";
import { getCommands, getCommand, isUserMod, getAllPlayerData, removePlayer, logData } from "./utilities";
import { Client, Message } from "discord.js";
import { LogType } from "../enums/LogType";
const isDev: boolean = process.env.NODE_ENV === "development";
const client: Client = new Client();
const botID: Array<string> = ["309700308697743362", "309700551799734274"]

let loginAttempts: number = 0;
let loginWaitInterval: number = 10 * 1000;

client.on("ready", () => {
    console.log(`Bot has logged in ${client.user?.tag}`)
    client.user?.setActivity('!pugs', { type: 'LISTENING'})
})

client.on("message", (message: Message) => {
    if (botID.includes(message.author.id)) {
        return;
    }
    
    try {
        const messageData: Array<string> = message.content.split(" ");
        const gameCommand: string | undefined = messageData.shift()?.toLowerCase() || "";
        const commandName: string | undefined = messageData.shift()?.toLowerCase() || "";
        const command: Command | undefined = getCommand(commandName);
        const isMod: boolean = isUserMod(message.member);
        const gameName: string = gameCommand.substr(1);
        let gameMethod: ((m: Message, c: Command, d: Array<string>) => void) | undefined;

        switch (gameCommand) {
            case "!ow":
                gameMethod = overwatch;
                break;
            case "!val": 
                gameMethod = valorant;
                break;
            default: 
                gameMethod = undefined;
                break;
        }
        
        if (gameMethod && command && (!command.isModCommand || (isMod && command.isModCommand))) {
            logData(LogType.DEBUG, `User ${message.author.tag} used ${gameCommand} ${commandName} ${messageData}`);
            switch (command.name) {
                case "help": {
                    let helpCommand: Command | undefined = getCommand(messageData.shift() || command.name);
                    let response: string = "";

                    if (helpCommand) {
                        response = helpCommand.help[gameName];

                        if (helpCommand.args[gameName]) {
                            response += `\n${gameCommand} ${helpCommand.name} ${helpCommand.args[gameName]}`
                        }
                    }

                    message.reply(response);
                }
                    break;
                case "commands": {
                    const commands: Array<Command> = getCommands(isMod);
                    message.reply(commands.map(x => x.name).join(", "));
                }
                    break;
                case "users": {
                    const users: Array<Player> = getAllPlayerData().filter(x => x[gameName]);
                    const response: string = `Users registered: ${users.length}\n${users.map(x => `- ${x.discordName}`).join("\n")}`;
                    message.channel.send(response);
                }
                    break;
                case "remove": {
                    const isRemoved = removePlayer(message.author);
                    message.reply(`You have ${isRemoved ? "" : "NOT "} been removed.`);
                }
                    break;
                default: {
                    gameMethod(message, command, messageData);
                }
                    break;
            }
        }
        else if (gameMethod && command) {
            message.reply("You do not have valid permissions to use this command or the command does not exist.");
        }
    }
    catch (err) {
        logData(LogType.FATAL, `The main application has handled an uncaught error. This could cause the application to crash.\n${err.message}\n${err.stack}`);
        message.channel.send(`Oooh no ya'll! Something is broken!... well try again and see if you can fix your error.`);
    }
})

function loginBot() {
    setTimeout(() => {
        client.login(isDev ? process.env.DEV_BOT_TOKEN : process.env.PROD_BOT_TOKEN)
        .then(() => {})
        .catch(err => {
            loginAttempts++;
            console.error(`Failed login attempt ${loginAttempts}`)
            console.log(err);
            loginBot();
        });
    }, loginAttempts === 0 ? 0 : loginWaitInterval)
}

loginBot();