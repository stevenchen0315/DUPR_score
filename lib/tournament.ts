export interface TournamentMatch {
  teamA: [string, string]
  teamB: [string, string]
}

export function generateRoundRobin(
  players: string[],
  gamesPerPlayer: number
): TournamentMatch[] {
  const n = players.length
  if (n < 4 || n > 8) return []

  const totalGames = (n * gamesPerPlayer) / 4
  if (!Number.isInteger(totalGames)) return []

  // 隨機打亂選手順序
  const P = [...players].sort(() => Math.random() - 0.5)

  const templates: Record<number, TournamentMatch[]> = {
    4: [
      { teamA: [P[0], P[1]], teamB: [P[2], P[3]] },
      { teamA: [P[0], P[2]], teamB: [P[1], P[3]] },
      { teamA: [P[0], P[3]], teamB: [P[1], P[2]] },
    ],
    5: [
      { teamA: [P[0], P[1]], teamB: [P[2], P[3]] },
      { teamA: [P[0], P[2]], teamB: [P[3], P[4]] },
      { teamA: [P[0], P[3]], teamB: [P[1], P[4]] },
      { teamA: [P[0], P[4]], teamB: [P[1], P[2]] },
      { teamA: [P[1], P[3]], teamB: [P[2], P[4]] },
    ],
    6: [
      { teamA: [P[0], P[1]], teamB: [P[2], P[3]] },
      { teamA: [P[0], P[2]], teamB: [P[4], P[5]] },
      { teamA: [P[0], P[3]], teamB: [P[1], P[4]] },
      { teamA: [P[0], P[5]], teamB: [P[2], P[4]] },
      { teamA: [P[1], P[2]], teamB: [P[3], P[5]] },
      { teamA: [P[1], P[3]], teamB: [P[2], P[4]] },
    ],
    7: [
      { teamA: [P[0], P[1]], teamB: [P[2], P[3]] },
      { teamA: [P[0], P[2]], teamB: [P[4], P[5]] },
      { teamA: [P[0], P[3]], teamB: [P[5], P[6]] },
      { teamA: [P[1], P[2]], teamB: [P[3], P[4]] },
      { teamA: [P[1], P[3]], teamB: [P[4], P[6]] },
      { teamA: [P[2], P[3]], teamB: [P[5], P[6]] },
      { teamA: [P[0], P[4]], teamB: [P[1], P[5]] },
    ],
    8: [
      { teamA: [P[0], P[1]], teamB: [P[2], P[3]] },
      { teamA: [P[4], P[5]], teamB: [P[6], P[7]] },
      { teamA: [P[0], P[2]], teamB: [P[4], P[6]] },
      { teamA: [P[1], P[3]], teamB: [P[5], P[7]] },
      { teamA: [P[0], P[3]], teamB: [P[5], P[6]] },
      { teamA: [P[1], P[2]], teamB: [P[4], P[7]] },
      { teamA: [P[0], P[4]], teamB: [P[1], P[5]] },
    ],
  }

  return templates[n].slice(0, totalGames)
}
