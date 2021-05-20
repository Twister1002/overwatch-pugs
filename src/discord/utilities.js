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

module.exports = {
    getRandomInt,
    parseToNumber,
    getSRTier
}