'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { player_info, score } from '@/types'
import { FiPlus as Plus, FiDownload as Download, FiTrash2 as Trash2 } from 'react-icons/fi'
import { FaLock, FaLockOpen } from 'react-icons/fa'

const LOCKED = 'Locked'
const UNLOCKED = 'Unlocked'

type CellField = 'D' | 'E' | 'F' | 'G'
type OtherField = 'h' | 'i' | 'lock' | 'sd'

type Row = {
  serial_number: number
  values: string[]
  sd: string
  h: string
  i: string
  lock: string
}

function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay = 200) {
  const timer = useRef<number | null>(null)
  return (...args: Parameters<T>) => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => fn(...args), delay)
  }
}

export default function ScorePage({ username }: { username: string }) {
  const [userList, setUserList] = useState<player_info[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [storedPassword, setStoredPassword] = useState<string | null>(null)
  const [event, setEvent] = useState('')
  const [eventName, setEventName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [partnerNumbers, setPartnerNumbers] = useState<{[key: string]: number | null}>({})
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMatch, setNewMatch] = useState({
    a1: '', a2: '', b1: '', b2: '', scoreA: '', scoreB: ''
  })
  
  // 追蹤本地更新時間戳
  const lastLocalUpdateRef = useRef<number>(0)

useEffect(() => {
  if (!username) return

  const fetchData = async () => {
    try {
      const { data: account, error: accountError } = await supabase
        .from('account')
        .select('password, event')
        .eq('username', username)
        .single()
      if (accountError) throw accountError
      if (account?.password) setStoredPassword(account.password)
      if (account?.event) {
        setEvent(account.event)
        setEventName(account.event)
      }

      const { data: users, error: userError } = await supabase
        .from('player_info')
        .select('dupr_id, name, partner_number')
        .like('dupr_id', `%_${username}`)
      if (userError) throw userError
      if (users) {
        const partners: {[key: string]: number | null} = {}
        const userListData = users.map(u => {
          partners[u.name] = u.partner_number
          return { ...u, dupr_id: u.dupr_id.replace(`_${username}`, '') }
        })
        setUserList(userListData)
        setPartnerNumbers(partners)
      }

      // 初次全量抓一次
      await refetchScores()
      setIsLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setIsLoading(false)
    }
  }

  fetchData().then(() => {
    // 等數據載入完成後再建立 Realtime 訂閱
    resubscribe()
  })

  return () => {
    if (scoreChannelRef.current) supabase.removeChannel(scoreChannelRef.current)
    if (playerChannelRef.current) supabase.removeChannel(playerChannelRef.current)
  }
}, [username])

useEffect(() => {
  if (!username) return

  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      refetchScores()
      refetchPlayers()
      if (!scoreChannelRef.current || !playerChannelRef.current) resubscribe()
    }
  }
  const onFocus = () => { refetchScores(); refetchPlayers() }
  const onOnline = () => { refetchScores(); refetchPlayers(); resubscribe() }
  const onPageShow = () => { refetchScores(); refetchPlayers(); resubscribe() } // iOS/Safari from bfcache

  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onFocus)
  window.addEventListener('online', onOnline)
  window.addEventListener('pageshow', onPageShow)

  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', onFocus)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('pageshow', onPageShow)
  }
}, [username])

// 用來保存目前的 Realtime channel
const scoreChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
const playerChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

// 重新抓取屬於該使用者的 score（全量補拉）
const refetchScores = async () => {
  if (!username) return
  const { data } = await supabase
    .from('score')
    .select('*')
    .like('serial_number', `%_${username}`)
  if (data) {
    const sorted = data.sort((a, b) => parseInt(a.serial_number) - parseInt(b.serial_number))
    setRows(formatScores(sorted))
  }
}
// 重新抓取選手資料
const refetchPlayers = async () => {
  if (!username) return
  const { data: users } = await supabase
    .from('player_info')
    .select('dupr_id, name, partner_number')
    .like('dupr_id', `%_${username}`)
  if (users) {
    const partners: {[key: string]: number | null} = {}
    const userListData = users.map(u => {
      partners[u.name] = u.partner_number
      return { ...u, dupr_id: u.dupr_id.replace(`_${username}`, '') }
    })
    setUserList(userListData)
    setPartnerNumbers(partners)
  }
}
// 建立或重建 Realtime 訂閱（幂等）
const resubscribe = () => {
  if (!username) return
  // 清理舊的 channels
  if (scoreChannelRef.current) supabase.removeChannel(scoreChannelRef.current)
  if (playerChannelRef.current) supabase.removeChannel(playerChannelRef.current)
  setRealtimeConnected(false)

  // Score 表的 channel
  const scoreChannel = supabase
    .channel(`score-${username}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'score'       
      },
      async (payload: any) => {
        console.log('Score change detected:', payload)
        const now = Date.now()
        // 如果是 3 秒內的本地更新，就忽略
        if (now - lastLocalUpdateRef.current < 3000) {
          console.log('Ignoring own update')
          return
        }
        const serialNumber = payload.new?.serial_number || payload.old?.serial_number
        if (serialNumber && typeof serialNumber === 'string' && serialNumber.includes(`_${username}`)) {
          await refetchScores()
        }
      }
    )
    .subscribe((status) => {
      console.log('Score channel status:', status)
    })

  // Player 表的 channel
  const playerChannel = supabase
    .channel(`player-${username}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'player_info'
      },
      async (payload: any) => {
        console.log('Player change detected:', payload)
        const duprId = payload.new?.dupr_id || payload.old?.dupr_id
        if (duprId && typeof duprId === 'string' && duprId.includes(`_${username}`)) {
          console.log('Refreshing players...')
          await refetchPlayers()
        }
      }
    )
    .subscribe((status) => {
      console.log('Player channel status:', status)
      // 只有當兩個 channel 都連接成功時才設為 connected
      if (status === 'SUBSCRIBED') {
        // 檢查是否兩個 channel 都已連接
        setTimeout(() => {
          setRealtimeConnected(true)
        }, 1000)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setTimeout(() => resubscribe(), 3000)
      }
    })

  scoreChannelRef.current = scoreChannel
  playerChannelRef.current = playerChannel
}
  
  const formatScores = (scores: score[]): Row[] => {
    return scores.map((item: score) => {
      const serialNum = parseInt(item.serial_number.toString().replace(`_${username}`, ''))
      return {
        serial_number: serialNum,
        values: [item.player_a1, item.player_a2, item.player_b1, item.player_b2],
        h: item.team_a_score?.toString() ?? '',
        i: item.team_b_score?.toString() ?? '',
        lock: item.lock ? LOCKED : UNLOCKED,
        sd:
          [item.player_a1, item.player_a2].filter(Boolean).length === 1 &&
          [item.player_b1, item.player_b2].filter(Boolean).length === 1
            ? 'S'
            : [item.player_a1, item.player_a2].filter(Boolean).length === 2 &&
              [item.player_b1, item.player_b2].filter(Boolean).length === 2
            ? 'D'
            : ''
      }
    })
  }
  
const debouncedSave = useDebouncedCallback(async (row: Row) => {
  lastLocalUpdateRef.current = Date.now() // 記錄更新時間
  const [a1, a2, b1, b2] = row.values
  await supabase.from('score').upsert({
    serial_number: `${row.serial_number}_${username}`,
    player_a1: a1,
    player_a2: a2,
    player_b1: b1,
    player_b2: b2,
    team_a_score: row.h === '' ? null : parseInt(row.h),
    team_b_score: row.i === '' ? null : parseInt(row.i),
    lock: row.lock === LOCKED
  })
}, 500)
  
  const updateCell = (rowIndex: number, field: CellField | OtherField, value: string) => {
    // 樂觀更新：立即更新 UI
    const newRows = rows.map((r, i) => {
      if (i !== rowIndex) return r

      const updatedRow: Row = {
        ...r,
        values: [...r.values]
      }

      if (['h', 'i', 'lock'].includes(field)) {
        if ((field === 'h' || field === 'i') && value !== '') {
          if (!/^\d{1,2}$/.test(value) || +value > 99) return r
        }
        (updatedRow as any)[field] = value
      } else {
        const colIndex = { D: 0, E: 1, F: 2, G: 3 }[field as CellField]
        const oldValue = updatedRow.values[colIndex]
        updatedRow.values[colIndex] = value
        
        // 固定隊友自動帶入和防呆邏輯
        if (value && partnerNumbers[value]) {
          // 選擇固定隊友 - 自動帶入
          const partnerNum = partnerNumbers[value]
          const partnerName = Object.keys(partnerNumbers).find(name => 
            name !== value && partnerNumbers[name] === partnerNum
          )
          
          if (partnerName) {
            if (colIndex === 0) { // A1 -> A2
              updatedRow.values[1] = partnerName
            } else if (colIndex === 1) { // A2 -> A1
              updatedRow.values[0] = partnerName
            } else if (colIndex === 2) { // B1 -> B2
              updatedRow.values[3] = partnerName
            } else if (colIndex === 3) { // B2 -> B1
              updatedRow.values[2] = partnerName
            }
          }
        } else if (value && !partnerNumbers[value]) {
          // 選擇非固定隊友 - 檢查是否需要清空對應位置
          if (oldValue && partnerNumbers[oldValue]) {
            // 原本是固定隊友，現在改成非固定隊友，需要清空對應位置
            if (colIndex === 0) { // A1 改變，清空 A2
              updatedRow.values[1] = ''
            } else if (colIndex === 1) { // A2 改變，清空 A1
              updatedRow.values[0] = ''
            } else if (colIndex === 2) { // B1 改變，清空 B2
              updatedRow.values[3] = ''
            } else if (colIndex === 3) { // B2 改變，清空 B1
              updatedRow.values[2] = ''
            }
          }
        } else if (!value) {
          // 清空選擇 - 如果對應位置是固定隊友，也要清空
          let partnerIndex = -1
          if (colIndex === 0) partnerIndex = 1 // A1 清空，檢查 A2
          else if (colIndex === 1) partnerIndex = 0 // A2 清空，檢查 A1
          else if (colIndex === 2) partnerIndex = 3 // B1 清空，檢查 B2
          else if (colIndex === 3) partnerIndex = 2 // B2 清空，檢查 B1
          
          if (partnerIndex >= 0) {
            const partnerValue = updatedRow.values[partnerIndex]
            if (partnerValue && partnerNumbers[partnerValue] && oldValue && partnerNumbers[oldValue] && 
                partnerNumbers[partnerValue] === partnerNumbers[oldValue]) {
              // 對應位置是同組固定隊友，也要清空
              updatedRow.values[partnerIndex] = ''
            }
          }
        }
      }

      const [a1, a2, b1, b2] = updatedRow.values
      const teamACount = [a1, a2].filter(Boolean).length
      const teamBCount = [b1, b2].filter(Boolean).length
      updatedRow.sd = teamACount === 1 && teamBCount === 1 ? 'S' : teamACount === 2 && teamBCount === 2 ? 'D' : ''

      return updatedRow
    })

    setRows(newRows)

    const row = newRows[rowIndex]
    const [a1, a2, b1, b2] = row.values
    
    debouncedSave(row)
  }

const deleteRow = async (index: number) => {
  const row = rows[index]
  // 先更新本地
  const updated = [...rows]; updated.splice(index, 1); setRows(updated)
  // 僅刪除單列（避免整表抖動與資料競爭）
  await supabase.from('score').delete()
    .eq('serial_number', `${row.serial_number}_${username}`)
}

const openAddModal = () => {
  setNewMatch({ a1: '', a2: '', b1: '', b2: '', scoreA: '', scoreB: '' })
  setShowAddModal(true)
}

const addRow = async () => {
  const nextSerial = rows.length > 0 ? Math.max(...rows.map(r => r.serial_number)) + 1 : 1
  const payload = {
    serial_number: `${nextSerial}_${username}`,
    player_a1: '', player_a2: '', player_b1: '', player_b2: '',
    team_a_score: null, team_b_score: null, lock: false,
  }
  const { error } = await supabase.from('score').insert(payload)
}

const closeAddModal = () => {
  setShowAddModal(false)
  setNewMatch({ a1: '', a2: '', b1: '', b2: '', scoreA: '', scoreB: '' })
}

const submitNewMatch = async () => {
  const nextSerial = rows.length > 0 ? Math.max(...rows.map(r => r.serial_number)) + 1 : 1
  const payload = {
    serial_number: `${nextSerial}_${username}`,
    player_a1: newMatch.a1,
    player_a2: newMatch.a2,
    player_b1: newMatch.b1,
    player_b2: newMatch.b2,
    team_a_score: newMatch.scoreA ? parseInt(newMatch.scoreA) : null,
    team_b_score: newMatch.scoreB ? parseInt(newMatch.scoreB) : null,
    lock: true,
  }
  const { error } = await supabase.from('score').insert(payload)
  if (!error) {
    closeAddModal()
  }
}

const handleNewMatchChange = (field: string, value: string) => {
  // 分數驗證邏輯與桌面版一致
  if ((field === 'scoreA' || field === 'scoreB') && value !== '') {
    if (!/^\d{1,2}$/.test(value) || +value > 21) return
  }
  
  setNewMatch(prev => ({ ...prev, [field]: value }))
  
  // 固定隊友自動帶入邏輯
  if (['a1', 'a2', 'b1', 'b2'].includes(field) && value && partnerNumbers[value]) {
    const partnerNum = partnerNumbers[value]
    const partnerName = Object.keys(partnerNumbers).find(name => 
      name !== value && partnerNumbers[name] === partnerNum
    )
    
    if (partnerName) {
      if (field === 'a1') setNewMatch(prev => ({ ...prev, a2: partnerName }))
      else if (field === 'a2') setNewMatch(prev => ({ ...prev, a1: partnerName }))
      else if (field === 'b1') setNewMatch(prev => ({ ...prev, b2: partnerName }))
      else if (field === 'b2') setNewMatch(prev => ({ ...prev, b1: partnerName }))
    }
  } else if (['a1', 'a2', 'b1', 'b2'].includes(field) && value && !partnerNumbers[value]) {
    // 選擇非固定隊友時，清空對應的固定隊友
    const currentMatch = { ...newMatch, [field]: value }
    if (field === 'a1' && currentMatch.a2 && partnerNumbers[currentMatch.a2]) {
      setNewMatch(prev => ({ ...prev, a2: '' }))
    } else if (field === 'a2' && currentMatch.a1 && partnerNumbers[currentMatch.a1]) {
      setNewMatch(prev => ({ ...prev, a1: '' }))
    } else if (field === 'b1' && currentMatch.b2 && partnerNumbers[currentMatch.b2]) {
      setNewMatch(prev => ({ ...prev, b2: '' }))
    } else if (field === 'b2' && currentMatch.b1 && partnerNumbers[currentMatch.b1]) {
      setNewMatch(prev => ({ ...prev, b1: '' }))
    }
  }
}

const getAvailableOptions = (excludeFields: string[]) => {
  const selected = excludeFields.map(field => newMatch[field as keyof typeof newMatch]).filter(Boolean)
  return userList.map(u => u.name).filter(name => !selected.includes(name)).sort()
}

const validateNewMatch = () => {
  const { a1, a2, b1, b2, scoreA, scoreB } = newMatch
  
  // 計算每隊人數
  const teamACount = [a1, a2].filter(Boolean).length
  const teamBCount = [b1, b2].filter(Boolean).length
  
  // A與B隊至少要選一位
  if (teamACount === 0 || teamBCount === 0) return false
  
  // 分數不能為空
  if (!scoreA || !scoreB) return false
  
  // 不能有一隊2位，另一隊1位的狀況
  if ((teamACount === 2 && teamBCount === 1) || (teamACount === 1 && teamBCount === 2)) return false
  
  // 1v1只能選A1與B1，不能選A2+B2
  if (teamACount === 1 && teamBCount === 1) {
    if (!a1 || !b1 || a2 || b2) return false
  }
  
  return true
}

  const handleDeleteAll = async () => {
    const confirmed = window.confirm('⚠️ 確定要刪除所有比賽資料嗎？此操作無法復原！')
    if (!confirmed) return

    const { error } = await supabase.from('score').delete().like('serial_number', `%_${username}`)
    if (!error) {
      setRows([])
      setDeleteMessage('✅ 所有比賽資料已刪除')
    } else {
      setDeleteMessage('❌ 刪除失敗，請稍後再試')
    }
  }

  const getFilteredOptions = (row: Row, currentIndex: number) => {
    const selected = row.values.filter((v, i) => v && i !== currentIndex)
    return userList.map((u) => u.name).filter((n) => !selected.includes(n)).sort()
  }

  const exportCSV = () => {
    const today = new Date().toISOString().slice(0, 10)

    // ✅ 僅清除 dupr_id 中的 _username
    const cleanDuprId = (text: string) => text.replace(`_${username}`, '')

    const findUser = (name: string): player_info => {
      const user = userList.find((u) => u.name === name)
      return user ? { dupr_id: cleanDuprId(user.dupr_id), name: user.name } : { dupr_id: '', name: '' }
  }

  const csvRows = rows.map((row) => {
    const [a1, a2, b1, b2] = row.values
    const a1User = findUser(a1), a2User = findUser(a2)
    const b1User = findUser(b1), b2User = findUser(b2)

    return [
      '', '', '', row.sd, eventName, today,
      a1User.name, a1User.dupr_id, '',
      a2User.name, a2User.dupr_id, '',
      b1User.name, b1User.dupr_id, '',
      b2User.name, b2User.dupr_id, '', '',
      row.h, row.i
    ]
  })

  const csvContent = csvRows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export_dupr_matches_${username}_${today}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
  
useEffect(() => {
  if (!isLoading && realtimeConnected) {
    setTimeout(() => {
      // 滾動到添加比賽按鈕
      const mobileButton = document.getElementById('add-match-button-mobile')
      const desktopButton = document.getElementById('add-match-button-desktop')
      const targetButton = mobileButton || desktopButton
      if (targetButton) {
        targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 200)
  }
}, [isLoading, realtimeConnected])

// 監聽滾動事件，控制回到頂部按鈕顯示
useEffect(() => {
  const handleScroll = () => {
    setShowScrollTop(window.scrollY > 300)
  }
  
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [])

// 回到頂部功能
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
  
if (isLoading || !realtimeConnected) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

return (
  <div className="px-2 sm:px-4">
    {/* 統一表格佈局 */}
    <div className="overflow-x-auto">
      <table className="w-full border text-sm mb-6">
        <thead>
          <tr>
            <th className="border p-1">#</th>
            <th className="border p-1">A1</th>
            <th className="border p-1">A2</th>
            <th className="border p-1">B1</th>
            <th className="border p-1">B2</th>
            <th className="border p-1 text-center w-12">S/D</th>
            <th className="border p-1 text-center w-20">A Score</th>
            <th className="border p-1 text-center w-20">B Score</th>
            <th className="border p-1">Status</th>
            <th className="border p-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="border p-1 text-center font-medium">{row.serial_number}</td>
              {row.values.map((val, i) => (
                <td key={i} className="border p-1">
                  <select
                    value={val}
                    disabled={row.lock === 'Locked'}
                    onChange={(e) => updateCell(rowIndex, ['D', 'E', 'F', 'G'][i] as CellField, e.target.value)}
                  >
                    <option value="">--</option>
                    {getFilteredOptions(row, i).map((opt, idx) => (
                      <option key={idx} value={opt}>{opt.trim()}</option>
                    ))}
                  </select>
                </td>
              ))}
              <td className="border p-1 text-center">{row.sd}</td>
              <td className="border p-1">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="21"
                  step="1"
                  value={row.h}
                  onChange={(e) => updateCell(rowIndex, 'h', e.target.value)}
                  disabled={row.lock === 'Locked'}
                  className="w-full border px-1 text-center"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="21"
                  step="1"
                  value={row.i}
                  onChange={(e) => updateCell(rowIndex, 'i', e.target.value)}
                  disabled={row.lock === 'Locked'}
                  className="w-full border px-1 text-center"
                />
              </td>
              <td className="border p-1 text-center">
                <button
                  onClick={() => {
                    if (row.lock === 'Locked') {
                      if (deletePassword === storedPassword) {
                        updateCell(rowIndex, 'lock', 'Unlocked')
                      }
                    } else {
                      updateCell(rowIndex, 'lock', 'Locked')
                    }
                  }}
                  className={`px-2 py-1 rounded text-white ${
                    row.lock === 'Locked'
                      ? deletePassword === storedPassword
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-400 hover:bg-green-500'
                  }`}
                  disabled={row.lock === 'Locked' && deletePassword !== storedPassword}
                >
                  {row.lock === 'Locked' ? <FaLock size={16} /> : <FaLockOpen size={16} />}
                </button>
              </td>
              <td className="border p-1 text-center">
                <button
                  onClick={() => deleteRow(rowIndex)}
                  disabled={row.lock === 'Locked'}
                  className={`px-2 py-1 rounded text-white ${row.lock === 'Locked' ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="flex flex-col items-center mb-6 space-y-4">
      {/* 手機版添加比賽按鈕 - 打開 Modal */}
      <button
        id="add-match-button-mobile"
        onClick={openAddModal}
        className="md:hidden bg-green-600 text-white px-3 py-1 rounded w-36 flex justify-center"
      >
        <div className="flex items-center">
          <Plus size={16} className="mr-2" />
          <div className="leading-tight text-left">
            <div>添加比賽</div>
            <div className="text-xs">(Add Match)</div>
          </div>
        </div>
      </button>

      {/* 桌面版添加比賽按鈕 - 直接新增行 */}
      <button
        id="add-match-button-desktop"
        onClick={addRow}
        className="hidden md:flex bg-green-600 text-white px-3 py-1 rounded w-36 justify-center"
      >
        <div className="flex items-center">
          <Plus size={16} className="mr-2" />
          <div className="leading-tight text-left">
            <div>添加比賽</div>
            <div className="text-xs">(Add Match)</div>
          </div>
        </div>
      </button>
        
      {/* 分隔線 */}
      <div className="relative w-full my-4">
        <hr className="border-t border-gray-300" />
        <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-2 text-sm text-gray-500 italic">
          Organizer only
        </span>
      </div>
        
      {/* 輸出與刪除功能排成一列 */}
      <div className="flex items-center space-x-3">
        {/* 密碼輸入框 */}
        <input
          type="password"
          placeholder="Password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          className="border px-3 py-2 rounded w-24 text-sm h-10"
        />
        
        <button
          onClick={exportCSV}
          className="bg-yellow-500 text-white px-4 py-2 rounded inline-flex items-center text-sm h-10"
        >
          <Download size={18} className="mr-2" /> 匯出 CSV
        </button>

        <button
          onClick={handleDeleteAll}
          disabled={storedPassword === null || deletePassword !== storedPassword}
          className={`px-3 py-2 rounded text-white text-sm h-10 ${
            deletePassword === storedPassword
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          一鍵刪除
        </button>
      </div>

      {/* Event 設定輸入框 - 只在密碼正確時顯示 */}
      {deletePassword === storedPassword && (
        <div className="flex items-center space-x-3 mt-2">
          <label className="text-sm text-gray-600 w-16">Event:</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="border px-3 py-2 rounded flex-1 text-sm h-10 bg-white"
            placeholder="輸入 Event 名稱"
          />
        </div>
      )}

      {/* 提示訊息 */}
      {deleteMessage && <div className="text-red-600">{deleteMessage}</div>}
    </div>

    {/* 回到頂部按鈕 */}
    {showScrollTop && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 border border-white/20"
        aria-label="回到頂部"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    )}

    {/* 新增比賽 Modal - 只在手機版顯示 */}
    {showAddModal && (
      <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">新增比賽</h2>
            <button onClick={closeAddModal} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex gap-4 mb-4">
              {/* Team A */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Team A</label>
                <div className="space-y-2">
                  <select
                    value={newMatch.a1}
                    onChange={(e) => handleNewMatchChange('a1', e.target.value)}
                    className="w-full border rounded px-3 py-3 text-base"
                  >
                    <option value="">--</option>
                    {getAvailableOptions(['a2', 'b1', 'b2']).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <select
                  value={newMatch.a2}
                  onChange={(e) => handleNewMatchChange('a2', e.target.value)}
                  className="w-full border rounded px-3 py-3 text-base"
                >
                  <option value="">--</option>
                  {getAvailableOptions(['a1', 'b1', 'b2']).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">分數</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="21"
                  step="1"
                  value={newMatch.scoreA}
                  onChange={(e) => handleNewMatchChange('scoreA', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-center text-lg"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 垂直分隔線 */}
            <div className="border-l border-gray-300 mx-2"></div>

            {/* Team B */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Team B</label>
              <div className="space-y-2">
                <select
                  value={newMatch.b1}
                  onChange={(e) => handleNewMatchChange('b1', e.target.value)}
                  className="w-full border rounded px-3 py-3 text-base"
                >
                  <option value="">--</option>
                  {getAvailableOptions(['a1', 'a2', 'b2']).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <select
                  value={newMatch.b2}
                  onChange={(e) => handleNewMatchChange('b2', e.target.value)}
                  className="w-full border rounded px-3 py-3 text-base"
                >
                  <option value="">--</option>
                  {getAvailableOptions(['a1', 'a2', 'b1']).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">分數</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="21"
                  step="1"
                  value={newMatch.scoreB}
                  onChange={(e) => handleNewMatchChange('scoreB', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-center text-lg"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={closeAddModal}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={submitNewMatch}
              disabled={!validateNewMatch()}
              className={`px-4 py-2 rounded ${
                validateNewMatch()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              確認新增
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
  </div>
  )
}
