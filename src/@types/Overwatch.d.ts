
type OverwatchRole = "support" | "dps" | "tank" | "all";
type OverwatchTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Master" | "Grand Master";

type OverwatchConfig = {
    maxTeams: number;
    maxPlayersOnTeam: number;
    maxSRDiff: number;
    teamNames: Array<string>;
    roles: Array<{
        name: string;
        max: number;
    }>;
    maps: Array<string>;
}

type OverwatchMatch = {
    teams: Array<OverwatchTeam>,
    map: string,
    responseMessage: string,
    hasError: boolean,
    getSRDiff: () => number
}

type OverwatchTeam = {
    name: string,
    players: Array<Player>,
    tank: Array<Player>,
    dps: Array<Player>,
    support: Array<Player>,
    totalSR: () => number,
    avgSR: () => number,
    addPlayerToTeam: (player: Player, role: OverwatchRole) => void
    neededRoles: () => Array<OverwatchRole>
    getRandomNeededRole: () => OverwatchRole
}

type OverwatchQueuedPlayer = Player & {queue: Array<OverwatchRole>};

type OverwatchRoleBucket = {
    tank: Array<Player>,
    support: Array<Player>
    dps: Array<Player>
    getRandomPlayerFromRole: (role: OverwatchRole) => Player | undefined
    removePlayerFromBucket: (player: Player) => void
}