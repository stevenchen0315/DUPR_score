export interface TournamentMatch {
  teamA: [string, string]
  teamB: [string, string]
}

export function generateRoundRobin(players: string[], gamesPerPlayer: number): TournamentMatch[] {
  if (players.length < 4 || players.length > 8) return []
  
  const matches: TournamentMatch[] = []
  const playerGames: { [key: string]: number } = {}
  const usedMatchups = new Set<string>()
  
  // 初始化每個選手的比賽次數
  players.forEach(player => {
    playerGames[player] = 0
  })
  
  // 創建對戰組合的唯一標識符
  const createMatchKey = (teamA: [string, string], teamB: [string, string]) => {
    const allPlayers = [...teamA, ...teamB].sort()
    return allPlayers.join('-')
  }
  
  // 生成所有可能的雙打組合
  const allPairs: [string, string][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      allPairs.push([players[i], players[j]])
    }
  }
  
  // 持續生成比賽直到達到目標
  while (true) {
    let addedMatch = false
    
    // 檢查是否還有選手需要更多比賽
    const playersNeedingGames = players.filter(p => playerGames[p] < gamesPerPlayer)
    if (playersNeedingGames.length < 4) break
    
    // 嘗試所有可能的對戰組合
    for (let i = 0; i < allPairs.length && !addedMatch; i++) {
      for (let j = i + 1; j < allPairs.length && !addedMatch; j++) {
        const teamA = allPairs[i]
        const teamB = allPairs[j]
        
        // 檢查是否有重複選手
        const allPlayersInMatch = [...teamA, ...teamB]
        const uniquePlayers = new Set(allPlayersInMatch)
        if (uniquePlayers.size !== 4) continue
        
        // 檢查這個對戰組合是否已經存在
        const matchKey = createMatchKey(teamA, teamB)
        if (usedMatchups.has(matchKey)) continue
        
        // 檢查所有選手是否還需要比賽
        const allCanPlay = allPlayersInMatch.every(player => 
          playerGames[player] < gamesPerPlayer
        )
        
        if (allCanPlay) {
          // 添加比賽
          matches.push({ teamA, teamB })
          usedMatchups.add(matchKey)
          
          // 更新每個選手的比賽次數
          allPlayersInMatch.forEach(player => {
            playerGames[player]++
          })
          
          addedMatch = true
        }
      }
    }
    
    // 如果沒有找到新的比賽組合，結束
    if (!addedMatch) break
  }
  
  return matches
}
