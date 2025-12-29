export interface TournamentMatch {
  teamA: [string, string]
  teamB: [string, string]
}

export function generateRoundRobin(players: string[], gamesPerPlayer: number): TournamentMatch[] {
  if (players.length < 4 || players.length > 8) return []
  
  // 特殊處理4人情況
  if (players.length === 4) {
    const [a, b, c, d] = players
    const allMatches = [
      { teamA: [a, b] as [string, string], teamB: [c, d] as [string, string] },
      { teamA: [a, c] as [string, string], teamB: [b, d] as [string, string] },
      { teamA: [a, d] as [string, string], teamB: [b, c] as [string, string] }
    ]
    
    const matches: TournamentMatch[] = []
    for (let i = 0; i < Math.min(gamesPerPlayer, 3); i++) {
      matches.push(allMatches[i])
    }
    return matches
  }
  
  // 其他人數的處理
  const matches: TournamentMatch[] = []
  const playerGames: { [key: string]: number } = {}
  const usedMatches = new Set<string>()
  
  players.forEach(player => {
    playerGames[player] = 0
  })
  
  const allPairs: [string, string][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      allPairs.push([players[i], players[j]])
    }
  }
  
  const allPossibleMatches: TournamentMatch[] = []
  for (let i = 0; i < allPairs.length; i++) {
    for (let j = i + 1; j < allPairs.length; j++) {
      const teamA = allPairs[i]
      const teamB = allPairs[j]
      
      const allPlayersInMatch = [...teamA, ...teamB]
      if (new Set(allPlayersInMatch).size === 4) {
        allPossibleMatches.push({ teamA, teamB })
      }
    }
  }
  
  const createMatchKey = (match: TournamentMatch) => {
    const allPlayers = [...match.teamA, ...match.teamB].sort()
    return allPlayers.join('-')
  }
  
  while (true) {
    let addedMatch = false
    
    for (const match of allPossibleMatches) {
      const matchKey = createMatchKey(match)
      
      if (usedMatches.has(matchKey)) continue
      
      const allPlayersInMatch = [...match.teamA, ...match.teamB]
      
      const allNeedGames = allPlayersInMatch.every(player => 
        playerGames[player] < gamesPerPlayer
      )
      
      if (allNeedGames) {
        matches.push(match)
        usedMatches.add(matchKey)
        
        allPlayersInMatch.forEach(player => {
          playerGames[player]++
        })
        
        addedMatch = true
        break
      }
    }
    
    if (!addedMatch) break
  }
  
  return matches
}
