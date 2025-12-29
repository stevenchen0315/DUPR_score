export interface TournamentMatch {
  teamA: [string, string]
  teamB: [string, string]
}

export function generateRoundRobin(players: string[], gamesPerPlayer: number): TournamentMatch[] {
  if (players.length < 4) return []
  
  const matches: TournamentMatch[] = []
  const playerGames: { [key: string]: number } = {}
  const partnerships: { [key: string]: Set<string> } = {}
  
  // 初始化
  players.forEach(player => {
    playerGames[player] = 0
    partnerships[player] = new Set()
  })
  
  // 生成所有可能的雙打組合
  const allPairs: [string, string][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      allPairs.push([players[i], players[j]])
    }
  }
  
  // 生成比賽
  let attempts = 0
  const maxAttempts = 1000
  
  while (attempts < maxAttempts) {
    let foundMatch = false
    
    for (let i = 0; i < allPairs.length && !foundMatch; i++) {
      for (let j = i + 1; j < allPairs.length && !foundMatch; j++) {
        const teamA = allPairs[i]
        const teamB = allPairs[j]
        
        // 檢查是否有重複選手
        const allPlayersInMatch = [...teamA, ...teamB]
        if (new Set(allPlayersInMatch).size !== 4) continue
        
        // 檢查每個選手是否還能再打
        const canPlay = allPlayersInMatch.every(player => 
          playerGames[player] < gamesPerPlayer
        )
        
        if (canPlay) {
          matches.push({ teamA, teamB })
          
          // 更新統計
          allPlayersInMatch.forEach(player => {
            playerGames[player]++
          })
          
          // 更新搭檔關係
          partnerships[teamA[0]].add(teamA[1])
          partnerships[teamA[1]].add(teamA[0])
          partnerships[teamB[0]].add(teamB[1])
          partnerships[teamB[1]].add(teamB[0])
          
          foundMatch = true
        }
      }
    }
    
    if (!foundMatch) break
    attempts++
  }
  
  return matches
}
