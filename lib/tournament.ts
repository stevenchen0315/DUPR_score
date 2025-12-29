export interface TournamentMatch {
  teamA: [string, string]
  teamB: [string, string]
}

export function generateRoundRobin(
  players: string[]
): TournamentMatch[] {
  const n = players.length
  if (n < 4 || n > 8) return []

  // 根據人數決定每人打幾場
  const gamesPerPlayer = n === 4 ? 3 : n === 5 ? 4 : n === 6 ? 5 : n === 7 ? 4 : 7
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

  const allMatches = templates[n].slice(0, totalGames)
  
  // 重新排序避免連續打超過2場
  const reorderedMatches: TournamentMatch[] = []
  const playerConsecutive: { [key: string]: number } = {}
  
  players.forEach(player => {
    playerConsecutive[player] = 0
  })
  
  const remainingMatches = [...allMatches]
  
  while (remainingMatches.length > 0) {
    let foundMatch = false
    
    for (let i = 0; i < remainingMatches.length; i++) {
      const match = remainingMatches[i]
      const playersInMatch = [...match.teamA, ...match.teamB]
      
      // 檢查是否有選手會連續打第3場
      const wouldExceedLimit = playersInMatch.some(player => 
        playerConsecutive[player] >= 2
      )
      
      if (!wouldExceedLimit) {
        reorderedMatches.push(match)
        remainingMatches.splice(i, 1)
        
        // 更新連續場數
        players.forEach(player => {
          if (playersInMatch.includes(player)) {
            playerConsecutive[player]++
          } else {
            playerConsecutive[player] = 0
          }
        })
        
        foundMatch = true
        break
      }
    }
    
    // 如果找不到合適的比賽，強制選擇第一個
    if (!foundMatch && remainingMatches.length > 0) {
      const match = remainingMatches.shift()!
      reorderedMatches.push(match)
      
      const playersInMatch = [...match.teamA, ...match.teamB]
      players.forEach(player => {
        if (playersInMatch.includes(player)) {
          playerConsecutive[player]++
        } else {
          playerConsecutive[player] = 0
        }
      })
    }
  }
  
  return reorderedMatches
}
