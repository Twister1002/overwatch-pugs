require("dotenv").config();
const isDev = process.env.NODE_ENV === "development";
const overwatch = require("./overwatch");
const valorant = require("./valorant");
const { getCommands, getCommand, isUserMod, loadFile, saveFile } = require("./utilities");
const { Client } = require("discord.js");
const client = new Client();
const botID = ["309700308697743362", "309700551799734274"]

let loginAttempts = 0;
let loginWaitInterval = 10 * 1000;

client.on("ready", () => {
    console.log(`Bot has logged in ${client.user.tag}`)
    client.user.setActivity('!pugs', { type: 'LISTENING'})
})

client.on("message", (message) => {
    if (botID.includes(message.author.id)) {
        return;
    }

    try {
        const messageData = message.content.split(" ");
        const mainCommand = messageData.shift().toLowerCase();
        const subCommand = messageData.shift().toLowerCase();
        const command = getCommand(mainCommand.substr(1), subCommand);
        const globalCommand = getCommand("global", subCommand);
        const isMod = isUserMod(message.member);

        if (globalCommand) {
            switch (globalCommand.name) {
                case "help": {
                    let response = "";
                    const commandInfoName = messageData.shift();
                    const commandInfo = getCommand(mainCommand.substr(1), commandInfoName);

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
                    let response = "The commands you can use are: \n";
                    const commands = getCommands(mainCommand.substr(1));

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

function doUpdates() {
    // Version 1.1.1
    const realData = loadFile("playerData.json");

    if (!realData) {
        const data = loadFile("overwatchpugs.json");

        // If we have a record and the first record doesn't contain the player's ow or val data 
        // Create the update
        data.forEach(x => {
            if (!x.ow) {
                x.ow = {}
            }

            x.ow.btag = x.btag ? x.btag : "";
            x.ow.support = x.support ? x.support : x.support || 0;
            x.ow.tank = x.tank ? x.tank : x.tank || 0;
            x.ow.dps = x.dps ? x.dps : x.dps || 0;

            delete x.btag;
            delete x.support;
            delete x.tank;
            delete x.dps;
        });

        saveFile("playerdata.json", data);
    }
}

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

doUpdates();
loginBot();