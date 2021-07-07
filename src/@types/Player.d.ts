type Player = {
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