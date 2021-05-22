const { getRandomInt } = require("./utilities");
const overwatchMaps = require("../data/maps.json");

const config = {
    maxTeams: 2,
    maxPlayersOnTeam: 6,
    maxSRDiff: 35,
    teamNames: ["Blue", "Red"],
    roles: [
        {
            name: "tank",
            max: 2
        },
        {
            name: "dps",
            max: 2
        },
        {
            name: "support",
            max: 2
        }
    ]
}

function createOverWatchMatch(queuedPlayers) { 
    const matchData = {
        teams: [],
        map: "",
        responseMessage: "",
        hasError: false
    }
    const playersNeeded = config.maxTeams * config.maxPlayersOnTeam;

    if (queuedPlayers.length >= playersNeeded) {
        createTeams(matchData.teams);
        matchData.map = overwatchMaps[getRandomInt(0, overwatchMaps.length)];
        const response = placePlayersOnTeams(matchData.teams, queuedPlayers);

        const teamSRDiff = Math.floor((matchData.teams.reduce((totalSR, currentTeam) => currentTeam.avgSR())) / 2);
        if (teamSRDiff > config.maxSRDiff && teamSRDiff < -config.maxSRDiff) {
            matchData.hasError = true;
            matchData.responseMessage = `SR is too great of difference at ${teamSRDiff}`;
        }
        else {
            matchData.hasError = response.hasError;
            matchData.responseMessage = response.message;
        }
    }
    else {
        matchData.hasError = true;
        matchData.responseMessage = `Not enough players queued. Need ${queuedPlayers.length - playersNeeded} players`
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

module.exports = createOverWatchMatch;