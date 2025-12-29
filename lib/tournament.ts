export interface TournamentMatch {
  teamA: [string, string]
  teamB: [string, string]
}

export function generateRoundRobin(players: string[], gamesPerPlayer: number): TournamentMatch[] {
  if (players.length < 4) return []
  
  const matches: TournamentMatch[] = []
  const playerGames: { [key: string]: number } = {}
  const usedMatchups = new Set<string>()
  
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
  
  // 創建對戰組合的唯一標識符
  const createMatchKey = (teamA: [string, string], teamB: [string, string]) => {
    const sortedTeamA = [...teamA].sort()
    const sortedTeamB = [...teamB].sort()
    const allPlayers = [...sortedTeamA, ...sortedTeamB].sort()
    return allPlayers.join('-')
  }
  
  // 檢查是否所有選手都達到目標場次
  const allPlayersReachedTarget = () => {
    return players.every(player => playerGames[player] >= gamesPerPlayer)
  }
  
  let attempts = 0
  const maxAttempts = 1000
  
  while (!allPlayersReachedTarget() && attempts < maxAttempts) {
    let foundMatch = false
    
    // 找出還需要比賽的選手
    const needMoreGames = players.filter(player => playerGames[player] < gamesPerPlayer)
    
    if (needMoreGames.length < 4) break
    
    // 嘗試為需要比賽的選手安排對戰
    for (let i = 0; i < allPairs.length && !foundMatch; i++) {
      for (let j = i + 1; j < allPairs.length && !foundMatch; j++) {
        const teamA = allPairs[i]
        const teamB = allPairs[j]
        
        // 檢查是否有重複選手
        const allPlayersInMatch = [...teamA, ...teamB]
        if (new Set(allPlayersInMatch).size !== 4) continue
        
        // 檢查這個對戰組合是否已經存在
        const matchKey = createMatchKey(teamA, teamB)
        if (usedMatchups.has(matchKey)) continue
        
        // 檢查所有選手是否還需要比賽
        const canPlay = allPlayersInMatch.every(player => 
          playerGames[player] < gamesPerPlayer
        )
        
        if (canPlay) {
          matches.push({ teamA, teamB })
          usedMatchups.add(matchKey)
          
          // 更新每個選手的比賽次數
          allPlayersInMatch.forEach(player => {
            playerGames[player]++
          })
          
          foundMatch = true
        }
      }
    }
    
    if (!foundMatch) break
    attempts++
  }
  
  return matches
}
