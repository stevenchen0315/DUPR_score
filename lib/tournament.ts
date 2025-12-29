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
  
  // 創建對戰組合的唯一標識符
  const createMatchKey = (teamA: [string, string], teamB: [string, string]) => {
    const allPlayers = [...teamA, ...teamB].sort()
    return allPlayers.join('-')
  }
  
  // 生成所有可能的四人組合
  const allFourPlayerCombos: string[][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      for (let k = j + 1; k < players.length; k++) {
        for (let l = k + 1; l < players.length; l++) {
          allFourPlayerCombos.push([players[i], players[j], players[k], players[l]])
        }
      }
    }
  }
  
  // 為每個四人組合生成所有可能的對戰方式
  const generateMatchesForFourPlayers = (fourPlayers: string[]) => {
    const [a, b, c, d] = fourPlayers
    return [
      { teamA: [a, b] as [string, string], teamB: [c, d] as [string, string] },
      { teamA: [a, c] as [string, string], teamB: [b, d] as [string, string] },
      { teamA: [a, d] as [string, string], teamB: [b, c] as [string, string] }
    ]
  }
  
  // 重複嘗試直到每人都達到目標場數或無法再安排
  let attempts = 0
  const maxAttempts = 1000
  
  while (attempts < maxAttempts) {
    let foundMatch = false
    
    // 找出還需要比賽的選手
    const needMoreGames = players.filter(player => playerGames[player] < gamesPerPlayer)
    if (needMoreGames.length < 4) break
    
    // 嘗試所有四人組合
    for (const fourPlayers of allFourPlayerCombos) {
      // 檢查這四人是否都還需要比賽
      if (!fourPlayers.every(player => playerGames[player] < gamesPerPlayer)) continue
      
      // 為這四人生成所有可能的對戰方式
      const possibleMatches = generateMatchesForFourPlayers(fourPlayers)
      
      for (const match of possibleMatches) {
        const matchKey = createMatchKey(match.teamA, match.teamB)
        
        // 如果這個對戰組合還沒用過，且所有選手都還需要比賽
        if (!usedMatchups.has(matchKey) && 
            fourPlayers.every(player => playerGames[player] < gamesPerPlayer)) {
          
          matches.push(match)
          usedMatchups.add(matchKey)
          
          // 更新每個選手的比賽次數
          fourPlayers.forEach(player => {
            playerGames[player]++
          })
          
          foundMatch = true
          break
        }
      }
      
      if (foundMatch) break
    }
    
    if (!foundMatch) break
    attempts++
  }
  
  return matches
}
