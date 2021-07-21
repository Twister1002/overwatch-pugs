type DiscordUser = {
    discordName: string,
    discordid: string,
}

type OverwatchPlayerData = {
    btag: string,
    support?: number,
    tank?: number,
    dps?: number
}

type ValorantPlayerData = {
    riotTag: string,
    rank: number
}

type Player = DiscordUser & {
    ow?: OverwatchPlayerData,
    val?: ValorantPlayerData
}