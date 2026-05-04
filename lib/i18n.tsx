'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'zh' | 'en'

const dict = {
  // page tabs
  playerData: { zh: '選手資料', en: 'Players' },
  matchScores: { zh: '比賽分數', en: 'Matches' },
  organizer: { zh: '主辦方', en: 'Organizer' },

  // AdminPlayerPage
  namePlaceholder: { zh: '名稱 (name)', en: 'Name' },
  updatePlayer: { zh: '更新選手', en: 'Update' },
  addPlayer: { zh: '新增選手', en: 'Add' },
  exportCsvTooltip: { zh: '匯出 CSV', en: 'Export CSV' },
  importCsvTooltip: { zh: '匯入 CSV', en: 'Import CSV' },
  importDisabledTooltip: { zh: '比賽進行中，無法匯入選手名單', en: 'Cannot import during active matches' },
  unlinkPartner: { zh: '解除固定', en: 'Unlink' },
  linkPartner: { zh: '固定隊友', en: 'Link Partner' },
  processing: { zh: '處理中...', en: 'Processing...' },
  organizerOnly: { zh: 'Organizer only', en: 'Organizer only' },
  deleteAll: { zh: '一鍵刪除', en: 'Delete All' },
  confirmDeleteAllPlayers: { zh: '⚠️ 確定要刪除所有玩家資料嗎？此操作無法復原！', en: '⚠️ Delete all players? This cannot be undone!' },
  allPlayersDeleted: { zh: '✅ 所有玩家資料已刪除', en: '✅ All players deleted' },
  deleteFailed: { zh: '❌ 刪除失敗，請稍後再試', en: '❌ Delete failed, please try again' },

  // AdminScorePage
  addMatch: { zh: '添加比賽', en: 'Add Match' },
  roundRobin: { zh: '循環賽', en: 'Round-robin' },
  exportCsv: { zh: '匯出 CSV', en: 'Export CSV' },
  confirmDeleteAllScores: { zh: '⚠️ 確定要刪除所有比賽資料嗎？此操作無法復原！', en: '⚠️ Delete all matches? This cannot be undone!' },
  allScoresDeleted: { zh: '✅ 所有比賽資料已刪除', en: '✅ All matches deleted' },
  eventPlaceholder: { zh: '輸入 Event 名稱', en: 'Enter event name' },
  ranking: { zh: '排名', en: 'Rankings' },
  rankingScope: { zh: '排名範圍：', en: 'Scope:' },
  allPlayers: { zh: '全部選手', en: 'All Players' },
  clear: { zh: '清除', en: 'Clear' },
  rankCol: { zh: '排名', en: 'Rank' },
  playerCol: { zh: '選手', en: 'Player' },
  winsCol: { zh: '勝場', en: 'W' },
  lossesCol: { zh: '敗場', en: 'L' },

  // Add/Edit Match Modal
  newMatch: { zh: '新增比賽', en: 'New Match' },
  editMatch: { zh: '編輯比賽', en: 'Edit Match' },
  scoreType: { zh: '計分方式', en: 'Score Type' },
  sideout: { zh: '發球得分', en: 'Sideout' },
  rally: { zh: '直接得分', en: 'Rally' },
  score: { zh: '分數', en: 'Score' },
  courtOptional: { zh: 'Court (Optional)', en: 'Court (Optional)' },
  courtPlaceholder: { zh: '輸入場地編號', en: 'Court number' },
  cancel: { zh: '取消', en: 'Cancel' },
  confirmAdd: { zh: '確認新增', en: 'Add' },
  done: { zh: '完成', en: 'Done' },
  delete: { zh: '刪除', en: 'Delete' },
  confirmDeleteMatch: { zh: '確定要刪除這場比賽嗎？', en: 'Delete this match?' },
  saveFailed: { zh: '儲存失敗，請重試', en: 'Save failed, please retry' },
  networkError: { zh: '網路錯誤，請重試', en: 'Network error, please retry' },
  wd: { zh: '棄賽', en: 'WD' },

  // Tournament Modal
  tournamentSettings: { zh: '循環賽設定', en: 'Round-robin Settings' },
  selectPlayers: { zh: '選擇選手', en: 'Select Players' },
  personUnit: { zh: '人', en: '' },
  autoArrangeHint: { zh: '系統會根據人數自動安排最佳場數，選手只能選4-8位', en: 'Auto-arranged for 4-8 players' },
  selectAll: { zh: '全選/全不選', en: 'Select All' },
  courtHintAll: { zh: '如果填寫，所有生成的比賽都會設定為此場地', en: 'All generated matches will use this court' },
  generateSchedule: { zh: '生成賽程', en: 'Generate' },
  generateFailed: { zh: '無法生成賽程，請檢查選手人數設定', en: 'Cannot generate, check player count' },
  partialAddFailed: { zh: '部分比賽新增失敗，請重試', en: 'Some matches failed, please retry' },

  // DUPR Ratings
  fetchDuprRatings: { zh: '查詢 DUPR', en: 'Fetch DUPR' },
  fetchingDupr: { zh: '查詢中...', en: 'Fetching...' },
  duprLogin: { zh: 'DUPR 登入', en: 'DUPR Login' },
  duprEmail: { zh: 'Email', en: 'Email' },
  duprPassword: { zh: '密碼', en: 'Password' },
  duprLoginBtn: { zh: '登入並查詢', en: 'Login & Fetch' },
  duprLoggingIn: { zh: '登入中...', en: 'Logging in...' },
  duprLoginFailed: { zh: '登入失敗，請確認帳號密碼', en: 'Login failed, check credentials' },
  duprClose: { zh: '關閉', en: 'Close' },
  duprInvalidId: { zh: '無效ID', en: 'Invalid ID' },

  // PlayerFilter
  filter: { zh: '篩選：', en: 'Filter:' },
  clearFilter: { zh: '清除', en: 'Clear' },

  // ScrollToTopButton
  scrollToTop: { zh: '回到頂部', en: 'Back to top' },
} as const

type DictKey = keyof typeof dict

interface LangContextType {
  lang: Lang
  toggle: () => void
  t: (key: DictKey) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'zh',
  toggle: () => {},
  t: (k) => dict[k].zh,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved === 'en' || saved === 'zh') setLang(saved)
  }, [])

  const toggle = () => {
    setLang((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh'
      localStorage.setItem('lang', next)
      return next
    })
  }

  const t = (key: DictKey) => dict[key][lang]

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLanguage = () => useContext(LangContext)
