const { getRandomInt } = require("./utilities");

const config = {
    teamMax: 2,
    playerMax: 6,
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

function placePlayersOnTeam(teams, roleBuckets) {
    let timesInLoop = 0;

    // While all teams have not been filled.
    while (!teams.every(team => team.players.length >= config.playerMax)) {
        timesInLoop++;
        if (timesInLoop > 20) {
            break;
        }

        // Find teams that need players.
        const teamsNeedPlayers = teams.filter(t => t.players.length < config.playerMax);

        // Grab random team
        const randomTeam = teamsNeedPlayers[getRandomInt(0, teamsNeedPlayers.length)];

        // Get available roles in team.
        const availableRoles = getAvailableRoles(randomTeam);
        const roleNeeded = availableRoles[getRandomInt(0, availableRoles.length)];

        // Error coming from availableRoles where 0 roles will be returned.
        if (roleNeeded) {
            // Find random player with role
            if (roleBuckets[roleNeeded].length === 0) {
                console.error(`No players in bucket: ${roleNeeded}`)
                continue;
            }

            const randomPlayer = {...roleBuckets[roleNeeded][getRandomInt(0, roleBuckets[roleNeeded].length)]};

            if (randomPlayer) {
                randomTeam[roleNeeded].push(randomPlayer);
                randomTeam.players.push(randomPlayer);
                randomTeam.mmr += randomPlayer[roleNeeded];

                // Clean up all roles with player in role
                removePlayerFromBucket(randomPlayer, roleBuckets);
            }
            else {
                console.error("Attempting to select player that doesn't exist!");
            }
        }
    }
}

function getAvailableRoles(team) {
    const availableRoles = config.roles.filter(role => team[role.name].length < role.max);
    const roleNames = availableRoles.map(r => r.name);

    return roleNames;
}

function removePlayerFromBucket(player, buckets) {
    const roles = Object.keys(buckets);
    
    roles.forEach(role => {
        const playerI = buckets[role].findIndex(p => p.name === player.name);

        if (playerI > -1) {
            buckets[role].splice(playerI, 1);
        }
    })
}

function CreateOverwatchMatch(playerData) {
    let teams = [];

    if (playerData.length >= (config.playerMax * config.teamMax)) {
        const roleBuckets = {
            tank: [],
            dps: [],
            support: []
        }

        for (let i = 0; i < config.teamMax; i++) {
            teams[i] = {
                mmr: 0,
                name: config.teamNames[i],
                tank: [],
                dps: [],
                support: [],
                players: []
            };
        }

        playerData.forEach(p => p.queue.forEach(q => roleBuckets[q].push(p)));
        placePlayersOnTeam(teams, roleBuckets);

        // Check for match evenness
        const teamMMRDiff = (teams[0].mmr / config.teamMax) - (teams[1].mmr / config.teamMax);
        if (!teams.every(t => t.players.length == config.playerMax)) {
            console.log(`Not enough players in a speciifc team. Redoing teams.`);
            teams = CreateOverwatchMatch(playerData);
        }
        else if (teamMMRDiff > config.maxSRDiff || teamMMRDiff < -config.maxSRDiff) {
            console.log(`Unbalanced teams: Team 1 (${teams[0].mmr}) vs Team 2 (${teams[1].mmr})`);
            teams = CreateOverwatchMatch(playerData);
        }

        // Add the average SR in the data
        teams.forEach(t => {
            t.avgSR = Math.floor(t.mmr / t.players.length);
        })
    }
    else {
        console.log("Not enough players to make a match. Please restart queue");
    }
    
    return teams;
}

module.exports = CreateOverwatchMatch;