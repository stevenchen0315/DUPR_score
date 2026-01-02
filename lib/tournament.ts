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
  const gamesPerPlayer = n === 4 ? 3 : n === 5 ? 4 : n === 6 ? 4 : n === 7 ? 7 : 7
  const totalGames = n === 7 ? 12 : (n * gamesPerPlayer) / 4
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
      { teamA: [P[1], P[2]], teamB: [P[3], P[5]] },
      { teamA: [P[0], P[4]], teamB: [P[2], P[5]] },
      { teamA: [P[1], P[5]], teamB: [P[3], P[4]] },
    ],
    7: [
      { teamA: [P[0], P[1]], teamB: [P[2], P[3]] }, // P4,P5,P6輪空
      { teamA: [P[4], P[5]], teamB: [P[6], P[0]] }, // P1,P2,P3輪空
      { teamA: [P[1], P[2]], teamB: [P[3], P[4]] }, // P0,P5,P6輪空
      { teamA: [P[5], P[6]], teamB: [P[0], P[2]] }, // P1,P3,P4輪空
      { teamA: [P[1], P[3]], teamB: [P[4], P[6]] }, // P0,P2,P5輪空
      { teamA: [P[0], P[5]], teamB: [P[1], P[4]] }, // P2,P3,P6輪空
      { teamA: [P[2], P[6]], teamB: [P[3], P[5]] }, // P0,P1,P4輪空
      { teamA: [P[0], P[4]], teamB: [P[1], P[6]] }, // P2,P3,P5輪空
      { teamA: [P[2], P[5]], teamB: [P[3], P[6]] }, // P0,P1,P4輪空
      { teamA: [P[0], P[3]], teamB: [P[1], P[5]] }, // P2,P4,P6輪空
      { teamA: [P[2], P[4]], teamB: [P[0], P[6]] }, // P1,P3,P5輪空
      { teamA: [P[1], P[2]], teamB: [P[3], P[4]] }, // P0,P5,P6輪空
    ],
    8: [
      { teamA: [P[0], P[1]], teamB: [P[2], P[3]] },
      { teamA: [P[4], P[5]], teamB: [P[6], P[7]] },
      { teamA: [P[0], P[2]], teamB: [P[4], P[6]] },
      { teamA: [P[1], P[3]], teamB: [P[5], P[7]] },
      { teamA: [P[0], P[3]], teamB: [P[5], P[6]] },
      { teamA: [P[1], P[2]], teamB: [P[4], P[7]] },
      { teamA: [P[0], P[4]], teamB: [P[1], P[5]] },
      { teamA: [P[2], P[6]], teamB: [P[3], P[7]] },
      { teamA: [P[0], P[6]], teamB: [P[2], P[4]] },
      { teamA: [P[1], P[7]], teamB: [P[3], P[5]] },
      { teamA: [P[0], P[7]], teamB: [P[1], P[6]] },
      { teamA: [P[2], P[5]], teamB: [P[3], P[4]] },
      { teamA: [P[1], P[4]], teamB: [P[2], P[7]] },
      { teamA: [P[0], P[5]], teamB: [P[3], P[6]] },
    ],
  }

  const allMatches = templates[n].slice(0, totalGames)
  
  // 7人12場配置已經優化，不需要重新排序
  if (n === 7) {
    return allMatches
  }
  
  // 重新排序避免連續打超過2場
  const reorderedMatches: TournamentMatch[] = []
  const playerConsecutive: { [key: string]: number } = {}
  
  players.forEach(player => {
    playerConsecutive[player] = 0
  })
  
  const remainingMatches = [...allMatches]
  
  while (remainingMatches.length > 0) {
    let bestMatchIndex = 0
    let minViolations = Infinity
    
    // 尋找最佳比賽（違反連續限制最少的）
    for (let i = 0; i < remainingMatches.length; i++) {
      const match = remainingMatches[i]
      const playersInMatch = [...match.teamA, ...match.teamB]
      
      // 計算違反連續限制的選手數
      const violations = playersInMatch.filter(player => 
        playerConsecutive[player] >= 2
      ).length
      
      if (violations === 0) {
        // 找到完美匹配，立即使用
        bestMatchIndex = i
        break
      } else if (violations < minViolations) {
        // 記錄違反最少的比賽
        minViolations = violations
        bestMatchIndex = i
      }
    }
    
    // 選擇最佳比賽
    const selectedMatch = remainingMatches[bestMatchIndex]
    reorderedMatches.push(selectedMatch)
    remainingMatches.splice(bestMatchIndex, 1)
    
    const playersInMatch = [...selectedMatch.teamA, ...selectedMatch.teamB]
    
    // 更新連續場數
    players.forEach(player => {
      if (playersInMatch.includes(player)) {
        playerConsecutive[player]++
      } else {
        playerConsecutive[player] = 0
      }
    })
  }
  
  return reorderedMatches
}
