
declare type OverwatchRole = "support" | "dps" | "tank";

declare interface OverwatchConfig {
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

declare interface OverwatchMatch {
    teams: Array<OverwatchTeam>,
    map: string,
    responseMessage: string,
    hasError: boolean,
    hasFatalError: boolean
}

declare interface OverwatchTeam {
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

declare type Player = {
    discordName: string,
    discordid: string,
    ow?: {
        btag: string,
        support?: number,
        tank?: number,
        dps?: number
    }
    val?: {
        riotTag: string,
        rank: number
    }
}