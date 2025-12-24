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
  DUPR_ID_PATTERN: /^[A-Z0-9]{6}$/
} as const