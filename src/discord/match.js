const { getRandomInt } = require("./utilities");
const overwatchMaps = require("../data/maps.json");
const originalConfig = require("../data/overwatchconfig.json");
let config = originalConfig;

function createOverWatchMatch(queuedPlayers) { 
    const matchData = {
        teams: [],
        map: "",
        responseMessage: "",
        hasError: false,
        hasFatalError: false
    }

    const playersNeeded = config.maxTeams * config.maxPlayersOnTeam;

    if (queuedPlayers.length >= playersNeeded) {
        createTeams(matchData.teams);
        matchData.map = overwatchMaps[getRandomInt(0, overwatchMaps.length)];
        const response = placePlayersOnTeams(matchData.teams, queuedPlayers);
        const allTeamSR = matchData.teams.map(team => team.avgSR())
        const maxTeamSRDiff = Math.max(...allTeamSR) - Math.min(...allTeamSR);
        
        if (maxTeamSRDiff > config.maxSRDiff || maxTeamSRDiff < -config.maxSRDiff) {
            matchData.hasError = true;
            matchData.responseMessage = `SR is too great of difference at ${maxTeamSRDiff}`;
        }
        else {
            matchData.hasError = response.hasError;
            matchData.responseMessage = response.message;
        }
    }
    else {
        matchData.hasFatalError = true;
        matchData.hasError = true;
        matchData.responseMessage = `Not enough players queued. Need ${playersNeeded - queuedPlayers.length} players`
    }
    
    return matchData;
}

function createTeams(teams) {
    while (teams.length < config.maxTeams) {
        teams.push({
            name: config.teamNames[teams.length] || "N/A",
            players: [],
            tank: [],
            support: [],
            dps: [],
            totalSR: function() {
                const roleNames = config.roles.map(r => r.name);
                let totalSR = 0;

                roleNames.forEach(r => this[r].forEach(p => totalSR += p[r]))

                return totalSR;
            },
            avgSR: function () {
                return Math.floor(this.totalSR() / this.players.length)
            },
            addPlayerToTeam: function (playerData, role) {
                this[role].push(playerData);
                this.players.push(playerData);
            },
            neededRoles: function () {
                const roleNamesNeeded = [];
                config.roles.forEach(r => {
                    if (this[r.name].length < r.max) {
                        roleNamesNeeded.push(r.name);
                    }
                })

                return roleNamesNeeded;
            }
        })
    }
}

function placePlayersOnTeams(teams, players) {
    const response = {
        hasError: false,
        message: ""
    }
    const queuedPlayers = [...players];
    const roleBucket = {
        tank: [],
        dps: [],
        support: [],
        getRandomPlayerFromRole: function (role) {
            if (this[role].length > 0) {
                const randomPosition = getRandomInt(0, this[role].length);

                return {...this[role][randomPosition]};
            }
            else {
                return undefined;
            }
        },
        removePlayerFromBucket: function (playerData) {
            const roles = config.roles.map(r => r.name);

            roles.forEach(r => {
                this[r] = this[r].filter(p => p.btag !== playerData.btag)
            })
        },
    }

    players.forEach(p => p.queue.forEach(q => roleBucket[q].push(p)));

    // attempt to make the teams within 200 iterations
    for (let i = 0; i < 200; i++) {
        const playersNeededInTeam = teams.filter(t => t.players.length < config.maxPlayersOnTeam);

        if (playersNeededInTeam.length > 0 ) {
            if (queuedPlayers.length > 0) {
                // Find random Team
                const team = playersNeededInTeam[getRandomInt(0, playersNeededInTeam.length)]

                // Find random Role
                const neededRoles = team.neededRoles();
                const randomRoleI = getRandomInt(0, neededRoles.length);

                const player = roleBucket.getRandomPlayerFromRole(neededRoles[randomRoleI]);
                if (player) {
                    roleBucket.removePlayerFromBucket(player);
                    team.addPlayerToTeam(player, neededRoles[randomRoleI]);
                }
                else {
                    response.hasError = true;
                    response.message = "Unable to finish creating teams. Not enough players available.";
                }
            }
            else {
                response.hasError = true;
                response.message = "Not enough players to fill the teams.";
                break;
            }
        }
        else {
            // No need to keep iterating. We have full teams.
            break;
        }
    }

    return response;
}

function getMatchConfig() {
    return config;
}

function setMatchConfig(settings) {
    const messages = [];

    if (Object.entries(settings).some(([setting, value]) => setting === "reset")) {
        resetMatchConfig();
        messages.push(`Settings have been reset`);
    }
    else {
        Object.entries(settings).forEach(([setting, value]) => {
            switch (setting) {
                case "maxsrdiff": 
                    config.maxSRDiff = value;
                    messages.push(`${setting}: ${value}`);
                    break;
                case "teams":
                    config.maxTeams = value;
                    messages.push(`${setting}: ${value}`);
                    break;
                case "tank":
                case "dps": 
                case "support":
                    const role = config.roles.find(x => x.name === setting);
                    
                    if (role) {
                        role.max = value;
                    }

                    messages.push(`${setting}: ${value}`);
                    break;
                default: 
                    messages.push(`Invalid setting "${setting}"`);
                    break;
            }
        })
    }

    // Calculate the new max player amount
    let maxPlayers = config.roles.reduce((maxPlayers, currentRole) => maxPlayers += currentRole.max, 0)
    config.maxPlayersOnTeam = maxPlayers;

    return messages.join("\n");
}

function resetMatchConfig() {
    config = originalConfig;
}

module.exports = {
    createOverWatchMatch,
    setMatchConfig,
    getMatchConfig
}