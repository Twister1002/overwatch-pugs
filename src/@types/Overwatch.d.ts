export namespace Overwatch {
    export type Role = "support" | "dps" | "tank";

    export type Match = {
        teams: Array<OverwatchTeam>,
        map: string,
        responseMessage: string,
        hasError: boolean,
        hasFatalError: boolean
    }

    export type Config = {
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

    export type Team = {
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
}