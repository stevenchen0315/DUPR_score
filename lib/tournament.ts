export interface TournamentMatch {
  teamA: [string, string]
  teamB: [string, string]
}

export function generateRoundRobin(players: string[], gamesPerPlayer: number): TournamentMatch[] {
  if (players.length < 4 || players.length > 8) return []
  
  const matches: TournamentMatch[] = []
  const playerGames: { [key: string]: number } = {}
  
  // 初始化每個選手的比賽次數
  players.forEach(player => {
    playerGames[player] = 0
  })
  
  // 生成所有可能的雙打組合
  const allPairs: [string, string][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      allPairs.push([players[i], players[j]])
    }
  }
  
  // 生成所有可能的比賽組合
  const allPossibleMatches: TournamentMatch[] = []
  for (let i = 0; i < allPairs.length; i++) {
    for (let j = i + 1; j < allPairs.length; j++) {
      const teamA = allPairs[i]
      const teamB = allPairs[j]
      
      // 檢查是否有重複選手
      const allPlayersInMatch = [...teamA, ...teamB]
      if (new Set(allPlayersInMatch).size === 4) {
        allPossibleMatches.push({ teamA, teamB })
      }
    }
  }
  
  // 重複添加比賽直到每人達到目標場數
  let round = 0
  while (round < gamesPerPlayer) {
    for (const match of allPossibleMatches) {
      const allPlayersInMatch = [...match.teamA, ...match.teamB]
      
      // 檢查這四個選手是否都還需要比賽
      const allNeedGames = allPlayersInMatch.every(player => 
        playerGames[player] < gamesPerPlayer
      )
      
      if (allNeedGames) {
        matches.push(match)
        
        // 更新每個選手的比賽次數
        allPlayersInMatch.forEach(player => {
          playerGames[player]++
        })
        
        break // 找到一場比賽後跳出，進入下一輪
      }
    }
    round++
  }
  
  return matches
}
