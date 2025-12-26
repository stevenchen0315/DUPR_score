export const LOCK_STATUS = {
  LOCKED: 'Locked',
  UNLOCKED: 'Unlocked'
} as const

export const MATCH_TYPE = {
  SINGLES: 'S',
  DOUBLES: 'D'
} as const

export const API_ENDPOINTS = {
  PLAYERS: (username: string) => `/api/read/players/${username}`,
  SCORES: (username: string) => `/api/read/scores/${username}`,
  ACCOUNT: (username: string) => `/api/read/account/${username}`,
  ACCOUNTS: '/api/read/account'
} as const

export const VALIDATION = {
  MAX_SCORE: 21,
  DUPR_ID_LENGTH: 6,
  DUPR_ID_PATTERN: /^[A-Z0-9]{6}$/,
  NAME_MAX_LENGTH: 25
} as const

// 工具函數
export const formatDateTime = (dateString?: string) => {
  if (!dateString) return '--'
  const date = new Date(dateString)
  return date.toLocaleString(navigator.language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

export const getPlayersInTable = (rows: any[], partnerNumbers: {[key: string]: number | null}) => {
  const playersInTable = new Set<string>()
  rows.forEach(row => {
    row.values.forEach((playerName: string) => {
      if (playerName && playerName.trim()) {
        playersInTable.add(playerName.trim())
      }
    })
  })
  return Array.from(playersInTable).sort((a, b) => {
    const aPartner = partnerNumbers[a] || 999
    const bPartner = partnerNumbers[b] || 999
    if (aPartner !== bPartner) return aPartner - bPartner
    return a.localeCompare(b)
  })
}

export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export const createFilteredRows = (rows: any[], selectedPlayerFilter: string) => {
  if (!selectedPlayerFilter) return rows
  return rows.filter(row => 
    row.values.some((player: string) => player === selectedPlayerFilter)
  )
}

export const handleFilterChange = (
  value: string, 
  setSelectedPlayerFilter: (value: string) => void, 
  storageKey: string
) => {
  setSelectedPlayerFilter(value)
  if (value) {
    localStorage.setItem(storageKey, value)
  } else {
    localStorage.removeItem(storageKey)
  }
}
