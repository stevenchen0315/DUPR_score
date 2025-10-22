'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { player_info } from '@/types'
import { FiEdit as Pencil, FiTrash2 as Trash2 } from 'react-icons/fi'
import { FiUpload as Upload, FiDownload as Download } from 'react-icons/fi'

export default function PlayerPage({ username }: { username: string }) {
  const [userInfo, setUserInfo] = useState<player_info>({ dupr_id: '', name: '' })
  const [userList, setUserList] = useState<player_info[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [lockedNames, setLockedNames] = useState<Set<string>>(new Set())
  const [loadingLockedNames, setLoadingLockedNames] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [storedPassword, setStoredPassword] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set())
  const [partnerNumbers, setPartnerNumbers] = useState<{[key: string]: number | null}>({})
  const suffix = `_${username}`
  const fileInputRef = useRef<HTMLInputElement>(null)
  const playerChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  
useEffect(() => {
    if (!username) return
  
  const fetchData = async () => {
      try {
        // 讀取密碼
        const { data: account, error: accountError } = await supabase
          .from('account')
          .select('password')
          .eq('username', username)
          .single()
        if (accountError) throw accountError
        if (account?.password) setStoredPassword(account.password)
        // 讀取 player_info 名單
        const { data: users, error: userError } = await supabase
          .from('player_info')
          .select('dupr_id, name, partner_number')
          .like('dupr_id', `%_${username}`)

        if (userError) throw userError
        if (users) {
          const partners: {[key: string]: number | null} = {}
          const userListData = users.map(u => {
            const cleanId = u.dupr_id.replace(`_${username}`, '')
            partners[u.name] = u.partner_number
            return {
              dupr_id: cleanId,
              name: u.name,
            }
          })
          setUserList(userListData)
          setPartnerNumbers(partners)
        }

        // 讀取 score 中出現過的 player 名稱
        const { data: scores, error: scoreError } = await supabase
          .from('score')
          .select('*')
          .like('serial_number', `%_${username}`)

        if (scoreError) throw scoreError

        if (scores) {
          const namesInScores = new Set<string>()
          scores.forEach(score => {
            const fields = ['player_a1', 'player_a2', 'player_b1', 'player_b2']
            fields.forEach(field => {
              const name = score[field]
              if (name) namesInScores.add(name)
            })
          })
          setLockedNames(namesInScores)
          setLoadingLockedNames(false) 
        }
        setIsLoading(false)

      } catch (error) {
        console.error('Fetch error:', error)
        setLoadingLockedNames(false)
        setIsLoading(false)
      }
    }

    fetchData().then(() => {
      resubscribe()
    })

    return () => {
      if (playerChannelRef.current) supabase.removeChannel(playerChannelRef.current)
    }
  }, [username])

  useEffect(() => {
    if (!username) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refetchPlayers()
        if (!playerChannelRef.current) resubscribe()
      }
    }
    const onFocus = () => { refetchPlayers() }
    const onOnline = () => { refetchPlayers(); resubscribe() }
    const onPageShow = () => { refetchPlayers(); resubscribe() }

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
  
  const refetchPlayers = async () => {
    if (!username) return
    const { data: users } = await supabase
      .from('player_info')
      .select('dupr_id, name, partner_number')
      .like('dupr_id', `%_${username}`)
    if (users) {
      const partners: {[key: string]: number | null} = {}
      const userListData = users.map(u => {
        const cleanId = u.dupr_id.replace(`_${username}`, '')
        partners[u.name] = u.partner_number
        return {
          dupr_id: cleanId,
          name: u.name,
        }
      })
      setUserList(userListData)
      setPartnerNumbers(partners)
    }
  }

  const resubscribe = () => {
    if (!username) return
    if (playerChannelRef.current) supabase.removeChannel(playerChannelRef.current)
    setRealtimeConnected(false)

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
        if (status === 'SUBSCRIBED') {
          setTimeout(() => {
            setRealtimeConnected(true)
          }, 1000)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => resubscribe(), 3000)
        }
      })

    playerChannelRef.current = playerChannel
  }

  // 🚀 一鍵刪除功能
  const handleDeleteAll = async () => {
    const confirmed = window.confirm('⚠️ 確定要刪除所有玩家資料嗎？此操作無法復原！')
    if (!confirmed) return

    const { error } = await supabase
      .from('player_info')
      .delete()
      .like('dupr_id', `%_${username}`)

    if (!error) {
      setUserList([])
      setDeleteMessage('✅ 所有玩家資料已刪除')
    } else {
      setDeleteMessage('❌ 刪除失敗，請稍後再試')
    }
  }
  
// 🚀 匯出 CSV
const exportCSV = () => {
  const rows = userList.map(u => [u.dupr_id, u.name])
  const csvContent = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${username}_players.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 🚀 匯入 CSV
const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (event) => {
    const text = event.target?.result as string
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean)

    const imported: player_info[] = lines.map(line => {
      const [dupr_id, name] = line.split(',').map(s => s.trim())
      return { dupr_id, name }
    })

    setUserList(imported)
    await saveUserToSupabase(imported)

    // ✅ 清空 input，避免第二次匯入同檔案不觸發
    e.target.value = ''
  }

  reader.readAsText(file)
}
  
  const saveUserToSupabase = async (list: player_info[]) => {
    try {
      const transformed = list.map(user => ({
        dupr_id: `${user.dupr_id.toUpperCase()}${suffix}`,
        name: user.name,
        partner_number: null
      }))
      const { error } = await supabase
        .from('player_info')
        .upsert(transformed, { onConflict: 'dupr_id' })
      if (error) throw error
    } catch (error: any) {
      console.error('Supabase save error:', error.message)
    }
  }

  const updateUserInfo = (field: keyof player_info, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }))
  }

  const addUser = async () => {
    if (!userInfo.dupr_id || !userInfo.name) return
    const updated = [...userList]
    if (editIndex !== null) {
      updated[editIndex] = userInfo
      setEditIndex(null)
    } else {
      updated.push(userInfo)
    }
    setUserList(updated)
    setUserInfo({ dupr_id: '', name: '' })
    await saveUserToSupabase(updated)
  }

  const editUser = (index: number) => {
    setUserInfo(userList[index])
    setEditIndex(index)
  }

  const deleteUser = async (index: number) => {
    const deletedUser = userList[index]
    const updated = [...userList]
    updated.splice(index, 1)
    setUserList(updated)

    const fullDuprId = `${deletedUser.dupr_id}${suffix}`

    const { error } = await supabase
      .from('player_info')
      .delete()
      .eq('dupr_id', fullDuprId)

    if (error) {
      console.error('Supabase delete error:', error.message)
    }
  }

  const togglePlayerSelection = (index: number) => {
    if (deletePassword !== storedPassword) return
    
    const user = userList[index]
    const partnerNum = partnerNumbers[user.name]
    const newSelected = new Set(selectedPlayers)
    
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      // 如果點選固定隊友，清空選擇並只選這個
      if (partnerNum) {
        newSelected.clear()
        newSelected.add(index)
      } else {
        // 點選非固定隊友
        if (newSelected.size === 0) {
          // 第一個選擇
          newSelected.add(index)
        } else if (newSelected.size === 1) {
          // 第二個選擇，檢查第一個是否為固定隊友
          const firstIndex = Array.from(newSelected)[0]
          const firstUser = userList[firstIndex]
          const firstPartnerNum = partnerNumbers[firstUser.name]
          
          if (firstPartnerNum) {
            // 第一個是固定隊友，不能選第二個
            return
          } else {
            // 都是非固定隊友，可以選
            newSelected.add(index)
          }
        }
      }
    }
    setSelectedPlayers(newSelected)
  }

  const handlePartnerAction = async () => {
    if (deletePassword !== storedPassword) return
    
    const selectedArray = Array.from(selectedPlayers)
    if (selectedArray.length === 0) return

    try {
      if (selectedArray.length === 1) {
        // 單個固定隊友解除固定
        const player = userList[selectedArray[0]]
        const partnerNum = partnerNumbers[player.name]
        
        if (partnerNum) {
          // 找到同組的另一個隊友並一起解除
          const partnerNames = Object.keys(partnerNumbers).filter(name => 
            partnerNumbers[name] === partnerNum
          )
          const partnerDuprIds = partnerNames.map(name => {
            const user = userList.find(u => u.name === name)
            return `${user?.dupr_id}${suffix}`
          })
          
          await supabase
            .from('player_info')
            .update({ partner_number: null })
            .in('dupr_id', partnerDuprIds)
          
          const updatedPartners = { ...partnerNumbers }
          partnerNames.forEach(name => {
            updatedPartners[name] = null
          })
          setPartnerNumbers(updatedPartners)
        }
      } else if (selectedArray.length === 2) {
        // 兩個玩家的操作
        const player1 = userList[selectedArray[0]]
        const player2 = userList[selectedArray[1]]
        
        // 直接從資料庫查詢最新的 partner_number 資料
        const { data: currentUsers } = await supabase
          .from('player_info')
          .select('partner_number')
          .like('dupr_id', `%_${username}`)
          .not('partner_number', 'is', null)
        
        const usedNumbers = new Set(currentUsers?.map(u => u.partner_number) || [])
        let nextNumber = 1
        while (usedNumbers.has(nextNumber)) {
          nextNumber++
        }
        
        console.log('Used numbers:', Array.from(usedNumbers), 'Next number:', nextNumber)

        await supabase
          .from('player_info')
          .update({ partner_number: nextNumber })
          .in('dupr_id', [`${player1.dupr_id}${suffix}`, `${player2.dupr_id}${suffix}`])
        
        // 更新本地狀態
        setPartnerNumbers(prev => ({
          ...prev,
          [player1.name]: nextNumber,
          [player2.name]: nextNumber
        }))
      }
      
      setSelectedPlayers(new Set())
      // 操作完成後重新抓取資料確保同步
      await refetchPlayers()
    } catch (error) {
      console.error('Partner action error:', error)
    }
  }

  const getButtonText = () => {
    const selectedArray = Array.from(selectedPlayers)
    if (selectedArray.length === 0) return null
    
    if (selectedArray.length === 1) {
      const player = userList[selectedArray[0]]
      const partnerNum = partnerNumbers[player.name]
      return partnerNum ? '解除固定' : null
    }
    
    if (selectedArray.length === 2) {
      return '固定隊友'
    }
    
    return null
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
    <div className="max-w-md mx-auto p-4">
      {/* 輸入區塊 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          className="border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          placeholder="DUPR ID"
          value={userInfo.dupr_id}
          onChange={(e) => updateUserInfo('dupr_id', e.target.value.toUpperCase())}
          type="text"
          inputMode="text"
        />
        <input
          className="border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          placeholder="名稱 (name)"
          value={userInfo.name}
          onChange={(e) => updateUserInfo('name', e.target.value)}
          type="text"
        />
        <button
          onClick={addUser}
          disabled={
            !/^[A-Z0-9]{6}$/.test(userInfo.dupr_id) || userInfo.name.trim() === ''
          }
          className={`rounded-md px-5 py-2 shadow flex-shrink-0 transition
            ${/^[A-Z0-9]{6}$/.test(userInfo.dupr_id) && userInfo.name.trim() !== ''
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
          aria-label={editIndex !== null ? '更新選手' : '新增選手'}
        >
          <div className="leading-tight text-center">
            <div>{editIndex !== null ? '更新選手' : '新增選手'}</div>
            <div className="text-xs">
              {editIndex !== null ? '(Update player)' : '(Add player)'}
            </div>
          </div>
        </button>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 ml-1">
          {userList.length} players
          <button
            onClick={exportCSV}
            className="text-green-600 hover:text-green-800"
            title="匯出 CSV"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800"
            title="匯入 CSV"
          >
            <Upload size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={importCSV}
            className="hidden"
          />
        </div>
      </div>

      {/* 固定隊友按鈕 */}
      {deletePassword === storedPassword && getButtonText() && (
        <div className="mb-4 text-center">
          <button
            onClick={handlePartnerAction}
            className={`px-4 py-2 text-white rounded-md ${
              getButtonText() === '解除固定' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {getButtonText()}
          </button>
        </div>
      )}

      {/* 玩家列表 */}
      <ul className="space-y-4">
        {userList.map((user, idx) => {
          const isLocked = lockedNames.has(user.name)
          const isSelected = selectedPlayers.has(idx)
          const partnerNum = partnerNumbers[user.name]
          const isAdmin = deletePassword === storedPassword
          
          // 檢查是否可點選
          const canSelect = isAdmin && (() => {
            if (selectedPlayers.size === 0) return true
            if (isSelected) return true
            
            const firstSelectedIndex = Array.from(selectedPlayers)[0]
            const firstSelectedUser = userList[firstSelectedIndex]
            const firstPartnerNum = partnerNumbers[firstSelectedUser.name]
            
            // 如果第一個選擇是固定隊友，其他人都不能選
            if (firstPartnerNum) return false
            
            // 如果第一個選擇是非固定隊友，則固定隊友不能選
            if (partnerNum) return false
            
            // 已選擇兩個非固定隊友，不能再選
            if (selectedPlayers.size >= 2) return false
            
            return true
          })()

          return (
            <li 
              key={idx} 
              className={`flex justify-between items-center rounded-lg shadow p-4 transition ${
                isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white'
              } ${
                canSelect ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'
              }`}
              onClick={() => canSelect && togglePlayerSelection(idx)}
            >
              <div className="text-base font-medium text-gray-800">
                {user.name} <span className="text-sm text-gray-500">({user.dupr_id})</span>
                {partnerNum && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Team {partnerNum}</span>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    editUser(idx)
                  }}
                  disabled={loadingLockedNames || isLocked}
                  className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  aria-label={`編輯 ${user.name}`}
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteUser(idx)
                  }}
                  disabled={loadingLockedNames || isLocked}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  aria-label={`刪除 ${user.name}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {/* 分隔線 */}
      <div className="relative w-full my-6">
        <hr className="border-t border-gray-300" />
        <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-2 text-sm text-gray-500 italic">
          Organizer only
        </span>
      </div>

      {/* 一鍵刪除區塊 */}
      <div className="flex items-center space-x-3 justify-center">
        <input
          type="password"
          placeholder="Password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          className="border px-3 py-2 rounded w-28 text-sm h-10"
        />
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

      {/* 提示訊息 */}
      {deleteMessage && <div className="text-center text-red-600 mt-2">{deleteMessage}</div>}
    </div>
  )
}
