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

module.exports = {
    getRandomInt,
    parseToNumber
}