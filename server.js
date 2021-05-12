const playerData = require("./src/data/players.json");

const config = {
    teamMax: 6,
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

const roleBuckets = {
    tank: [],
    dps: [],
    support: []
}

const soloPlayers = {
    tank: [],
    dps: [],
    support: []
}

function placePlayersInBuckets(players) {
    // Sort the players in their buckets: Solo, or role que
    players.sort((a, b) => a.queue.length - b.queue.length);

    players.forEach(p => {
        switch(p.queue.length) {
            case 1: 
                soloPlayers[p.queue[0]].push(p);
                break;
            case 2:
            case 3:
                p.queue.forEach(q => roleBuckets[q].push(p));
                break;
        }
    })

    console.log(roleBuckets);
}

function placeSoloPlayers(teams, players) {
    const roles = Object.keys(players);

    roles.forEach(role => {
        const playersInRole = players[role];

        playersInRole.forEach(player => {
            const team = getRandomInt(0, teams.length);

            teams[team].players.push(player);
            teams[team][role].push(player);
            teams[team].mmr += player[role];
        })

        delete players[role]
    })
}

function placePlayersOnTeam(teams, roleBuckets) {
    // While all teams have not been filled.
    while (!teams.every(team => team.players.length >= config.teamMax)) {
        // Find teams that need players.
        const teamsNeedPlayers = teams.filter(t => t.players.length < config.teamMax);

        // Grab random team
        const randomTeam = teamsNeedPlayers[getRandomInt(0, teamsNeedPlayers.length)];

        // Get available roles in team.
        const availableRoles = getAvailableRoles(randomTeam);
        const roleNeeded = availableRoles[getRandomInt(0, availableRoles.length)];

        // Error coming from availableRoles where 0 roles will be returned.
        if (roleNeeded) {
            // Find random player with role
            if (roleBuckets[roleNeeded].length === 0) {
                debugger;
                console.error(`No players in bucket, ${roleNeeded}`)
                break;
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

function makeTeams(maxTeams) {
    const teams = [];

    for (let i = 0; i < maxTeams; i++) {
        teams[i] = {
            mmr: 0,
            tank: [],
            dps: [],
            support: [],
            players: []
        };
    }
    
    placeSoloPlayers(teams, soloPlayers);
    placePlayersOnTeam(teams, roleBuckets);

    teams.forEach((t, iT) => {
        console.log(`Team ${iT} - ${t.mmr}`);
        console.log(t.players.map(p => console.log(p.name)));
    })

    return teams;
}

//The maximum is exclusive and the minimum is inclusive
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); 
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

placePlayersInBuckets(playerData);
const teams = makeTeams(2);

console.log(teams);
