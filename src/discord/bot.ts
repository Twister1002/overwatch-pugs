require("dotenv").config();
import overwatch from "./overwatch";
import valorant from "./valorant";
import { getCommands, getCommand, isUserMod, loadFile, saveFile, getAllPlayerData } from "./utilities";
import { Client, Message } from "discord.js";
const isDev: boolean = process.env.NODE_ENV === "development";
const client: Client = new Client();
const botID: Array<string> = ["309700308697743362", "309700551799734274"]

let loginAttempts: number = 0;
let loginWaitInterval: number = 10 * 1000;
const availableMainCommands: Array<string> = ["!ow", "!val"];

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
        const mainCommand: string | undefined = messageData.shift()?.toLowerCase() || "";

        if (!availableMainCommands.includes(mainCommand) || messageData.length < 1) {
            return;
        }

        const subCommand: string | undefined = messageData.shift()?.toLowerCase();
        const command: Command | undefined = getCommand(mainCommand.substr(1), subCommand);
        const globalCommand: Command | undefined = getCommand("global", subCommand);
        const isMod: boolean = isUserMod(message.member);

        if (globalCommand) {
            switch (globalCommand.name) {
                case "help": {
                    let response: string = "";
                    const commandInfoName: string | undefined = messageData.shift();
                    const commandInfo: Command | undefined = getCommand(mainCommand.substr(1), commandInfoName);

                    if (commandInfo && (!commandInfo.isModCommand || (isMod && commandInfo.isModCommand))) {
                        response = `\n${commandInfo.name}: ${commandInfo.help}`;

                        if (commandInfo.args) {
                            response += `\n\`${mainCommand} ${commandInfo.name} ${commandInfo.args}\``
                        }

                        message.reply(response);
                    }
                    else {
                        response = `No command information found for ${commandInfoName}\n${mainCommand} help ${globalCommand.args}`
                        message.reply(response);
                    }
                }
                    break;
                case "commands": {
                    let response: string = "The commands you can use are: \n";
                    const commands: Array<Command> = getCommands(mainCommand.substr(1));

                    if (commands.length > 0) {
                        response += commands
                        .filter(x => (!x.isModCommand || (isMod && x.isModCommand)))
                        .map(x => `\`${x.name}\``)
                        .join(", ");
                    }
                    else {
                        response = "No commands are available at the moment."
                    }

                    message.reply(response)
                }
                    break;
            }
        }
        else if (command && (!command.isModCommand || (isMod && command.isModCommand))) {
            switch (mainCommand) {
                case "!ow":
                    overwatch(message, command, messageData);
                    break;
                case "!val": 
                    valorant(message, command, messageData);
                    break;
            }
        }
    }
    catch (err) {
        console.error(`A fatal error has caused the application to crash. This is the main error catcher.\n${err.message}\n${err.stack}`)
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