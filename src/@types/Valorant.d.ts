type ValorantRank = "iron" | "bronze" | "silver" | "gold" | "plat" | "diamond" | "immortal" | "radiant";

type ValorantConfig = {
    maxTeams: number,
    maxPlayersPerTeam: number,
    teamNames: Array<string>,
    maxTierDiff: number,
    maps: Array<string>,
    ranks: Array<string>
}

type ValorantMatch = {
    teams: Array<ValorantTeam>,
    map: string,
    response: string,
    hasError: boolean,
    hasFatalError: boolean
}

type ValorantTeam = {
    name: string,
    players: Array<Player>,
    teamRank: number,
    avgRank: () => number,
    avgRankName: () => ValorantRank
}
