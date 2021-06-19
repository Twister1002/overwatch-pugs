let playersInQueue = [];
let canQueue = false;

function valorant(message, command, messageData) {
    switch (command.name) {
        case "startq": {
            canQueue = true;
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
            playersInQueue = [...playersInQueue.filter(x => x !== message.author.tag)];
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
            let response = `${playersInQueue.length} players in queue:\n${playersInQueue.join("\n")}`;

            message.channel.send(response);
        }
            break;
        case "maps": {

        }
            break;
        case "info": {
            
        }
            break;
        case "users": {

        }
            break;
        case "set": {

        }
            break;
        case "startmatch": {

        }
            break;
        case "testmatch": {

        }
            break;
    }
}

function addPlayerToQueue(discordUserTag) {
    const response = {
        error: false,
        message: ""
    };

    const isInQueue = playersInQueue.some(x => x === discordUserTag);

    if (!isInQueue) {
        playersInQueue.push(discordUserTag);
        response.message = "Added to queue";
    }
    else {
        response.error = true;
        response.message = "Already in queue";
    }

    return response;
}

module.exports = valorant;