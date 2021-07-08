import { getRandomInt, getSRTier } from "./utilities";
import originalConfig from "../data/overwatchconfig.json";
let config = originalConfig;

export function createOverWatchMatch(queuedPlayers: Array<OverwatchQueuedPlayer>) { 
    const playersNeeded = config.maxTeams * config.maxPlayersOnTeam;
    const matchData: OverwatchMatch = {
        teams: createTeams(),
        map: config.maps[getRandomInt(0, config.maps.length)],
        responseMessage: "",
        hasError: false,
        getSRDiff: function(): number {
            const teamsAvgSR = this.teams.map(x => x.avgSR());
            return Math.max(...teamsAvgSR) - Math.min(...teamsAvgSR);
        }
    }

    if (queuedPlayers.length >= playersNeeded) {
        const response = placePlayersOnTeams(matchData.teams, queuedPlayers);
        const srDiff: number = matchData.getSRDiff();
        
        if (srDiff > config.maxSRDiff || srDiff < -config.maxSRDiff) {
            matchData.hasError = true;
            matchData.responseMessage = `SR is too great of difference at ${srDiff}`;
        }
        else {
            matchData.hasError = response.hasError;
            matchData.responseMessage = response.message;
        }
    }
    else {
        throw new Error(`Not enough players queued. Need ${playersNeeded - queuedPlayers.length} players`);
    }
    
    return matchData;
}

function createTeams(): Array<OverwatchTeam> {
    const teams: Array<OverwatchTeam> = [];

    for (let i = 0; i < config.maxTeams; i++) {
        const team: OverwatchTeam = {
            name: config.teamNames[teams.length] || "N/A",
            players: [],
            tank: [],
            support: [],
            dps: [],
            totalSR: function(): number {
                const roleNames = config.roles.map(r => r.name);
                let totalSR = 0;

                roleNames.forEach(r => this[r].forEach(p => totalSR += p.ow[r]))

                return totalSR;
            },
            avgSR: function () {
                return Math.floor(this.totalSR() / this.players.length)
            },
            addPlayerToTeam: function (player: Player, role: OverwatchRole) {
                this[role].push(player);
                this.players.push(player);
            },
            neededRoles: function (): Array<OverwatchRole> {
                const roleNamesNeeded: Array<OverwatchRole> = [];
                config.roles.forEach(r => {
                    if (this[r.name].length < r.max) {
                        roleNamesNeeded.push(r.name as OverwatchRole);
                    }
                })

                return roleNamesNeeded;
            },
            getRandomNeededRole: function (): OverwatchRole {
                const neededRoles: Array<OverwatchRole> = this.neededRoles();
                const randomRole: OverwatchRole = neededRoles[getRandomInt(0, neededRoles.length)];
                return randomRole;
            }
        }

        teams.push(team);
    }

    return teams;
}

function placePlayersOnTeams(teams: Array<OverwatchTeam>, players: Array<OverwatchQueuedPlayer>) {
    const response = {
        hasError: false,
        message: ""
    }
    const queuedPlayers: Array<OverwatchQueuedPlayer> = [...players];
    const roleBucket: OverwatchRoleBucket = {
        tank: [],
        dps: [],
        support: [],
        getRandomPlayerFromRole: function (role: OverwatchRole): Player | undefined {
            if (this[role].length > 0) {
                const randomPosition = getRandomInt(0, this[role].length);

                return {...this[role][randomPosition]};
            }
            else {
                return undefined;
            }
        },
        removePlayerFromBucket: function (player: Player): void {
            const roles = config.roles.map(r => r.name);

            roles.forEach(r => {
                this[r] = this[r].filter(p => p.ow?.btag !== player.ow?.btag)
            })
        },
    }

    // Add each player into their respective buckets.
    players.forEach(p => p.queue.forEach(q => roleBucket[q].push(p)));

    // We need 12 players 
    // Loop until we have full teams, or until we're not able to add a player into a role
    // then break out of the loop
    while (true) {
        const teamsNeedPlayers: Array<OverwatchTeam> = teams.filter(t => t.players.length < config.maxPlayersOnTeam);

        if (teamsNeedPlayers.length > 0) {
            if (queuedPlayers.length > 0) {
                // Get a random team and role from the team.
                const team: OverwatchTeam = teamsNeedPlayers[getRandomInt(0, teamsNeedPlayers.length)]; 
                const neededRole: OverwatchRole = team.getRandomNeededRole();
                const player: Player | undefined = roleBucket.getRandomPlayerFromRole(neededRole);

                if (player) { // Do something with the queued Players list other wise.... yikes.
                    roleBucket.removePlayerFromBucket(player);
                    team.addPlayerToTeam(player, neededRole);
                }
                else {
                    response.hasError = true;
                    response.message = `No player found to place in ${neededRole}`
                    break;
                }
            }
            else {
                response.hasError = true;
                response.message = "Not enough role selections or players in queue.";
                break;
            }             
        }
        else {
            // All teams are filled up!
            break;
        }
    }

    return response;
}

export function getMatchConfig(): OverwatchConfig {
    return config;
}

export function setMatchConfig(settings): string {
    const messages: Array<string> = [];

    if (Object.entries(settings).some(([setting, value]) => setting === "reset")) {
        resetMatchConfig();
        messages.push(`Settings have been reset`);
    }
    else {
        Object.entries(settings).forEach(([setting, value]) => {
            switch (setting) {
                case "maxsrdiff": 
                    config.maxSRDiff = value as number;
                    messages.push(`${setting}: ${value}`);
                    break;
                case "teams":
                    config.maxTeams = value as number;
                    messages.push(`${setting}: ${value}`);
                    break;
                case "tank":
                case "dps": 
                case "support":
                    const role = config.roles.find(x => x.name === setting);
                    
                    if (role) {
                        role.max = value as number;
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

export function resetMatchConfig(): void {
    config = originalConfig;
}