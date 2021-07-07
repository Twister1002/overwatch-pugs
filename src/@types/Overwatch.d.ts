
type OverwatchRole = "support" | "dps" | "tank" | "all";
type OverwatchTier = "B" | "S" | "G" | "P" | "D" | "M" | "GM";

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
    hasFatalError: boolean
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
}