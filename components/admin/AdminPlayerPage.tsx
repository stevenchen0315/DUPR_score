'use client'

import { useState, useRef } from 'react'
import { usePlayerData } from '@/hooks/usePlayerData'
import PlayerList from '@/components/shared/PlayerList'
import { VALIDATION } from '@/lib/constants'
import { player_info } from '@/types'
import { FiUpload as Upload, FiDownload as Download } from 'react-icons/fi'

interface AdminPlayerPageProps {
  username: string
}

export default function AdminPlayerPage({ username }: AdminPlayerPageProps) {
  const {
    userList,
    partnerNumbers,
    storedPassword,
    isLoading,
    lockedNames,
    loadingLockedNames,
    hasActiveScores,
    realtimeConnected,
    setUserList,
    setPartnerNumbers
  } = usePlayerData(username)

  const [userInfo, setUserInfo] = useState<player_info>({ dupr_id: '', name: '' })
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set())
  const [isUpdatingPartner, setIsUpdatingPartner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const suffix = `_${username}`

  const saveUserToSupabase = async (list: (player_info & { partner_number?: number | null })[]) => {
    try {
      const response = await fetch(`/api/write/players/${username}?mode=admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list.map(user => ({
          dupr_id: user.dupr_id.toUpperCase(),
          name: user.name,
          partner_number: user.partner_number || null
        })))
      })
      
      if (!response.ok) {
        throw new Error('Failed to save players')
      }
      
      const updatedPartners = { ...partnerNumbers }
      list.forEach(user => {
        updatedPartners[user.name] = user.partner_number || null
      })
      setPartnerNumbers(updatedPartners)
    } catch (error: any) {
      console.error('Save error:', error.message)
    }
  }

  const updateUserInfo = (field: keyof player_info, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }))
  }

  const addUser = async () => {
    if (!userInfo.dupr_id || !userInfo.name) return
    const updated = [...userList]
    
    if (editIndex !== null) {
      const oldUser = updated[editIndex]
      const oldDuprId = `${oldUser.dupr_id.toUpperCase()}${suffix}`
      const newDuprId = `${userInfo.dupr_id.toUpperCase()}${suffix}`
      
      updated[editIndex] = userInfo
      setUserList(updated)
      setEditIndex(null)
      setUserInfo({ dupr_id: '', name: '' })
      
      if (oldDuprId !== newDuprId) {
        await fetch(`/api/write/players/${username}?dupr_id=${oldUser.dupr_id}&mode=admin`, {
          method: 'DELETE'
        })
      }
      
      const userWithPartner = {
        ...userInfo,
        partner_number: partnerNumbers[oldUser.name] || null
      }
      await saveUserToSupabase([userWithPartner])
    } else {
      updated.push(userInfo)
      setUserList(updated)
      setUserInfo({ dupr_id: '', name: '' })
      
      const userWithPartner = {
        ...userInfo,
        partner_number: null
      }
      await saveUserToSupabase([userWithPartner])
    }
  }

  const editUser = (index: number) => {
    setUserInfo(userList[index])
    setEditIndex(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteUser = async (index: number) => {
    const deletedUser = userList[index]
    const updated = [...userList]
    updated.splice(index, 1)
    setUserList(updated)

    const response = await fetch(`/api/write/players/${username}?dupr_id=${deletedUser.dupr_id}&mode=admin`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      console.error('Delete error:', await response.text())
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
      if (partnerNum) {
        newSelected.clear()
        newSelected.add(index)
      } else {
        if (newSelected.size === 0) {
          newSelected.add(index)
        } else if (newSelected.size === 1) {
          const firstIndex = Array.from(newSelected)[0]
          const firstUser = userList[firstIndex]
          const firstPartnerNum = partnerNumbers[firstUser.name]
          
          if (firstPartnerNum) {
            return
          } else {
            newSelected.add(index)
          }
        }
      }
    }
    setSelectedPlayers(newSelected)
  }

  const handlePartnerAction = async () => {
    if (deletePassword !== storedPassword || isUpdatingPartner) return
    
    setIsUpdatingPartner(true)
    const selectedArray = Array.from(selectedPlayers)
    if (selectedArray.length === 0) {
      setIsUpdatingPartner(false)
      return
    }

    try {
      if (selectedArray.length === 1) {
        const player = userList[selectedArray[0]]
        const partnerNum = partnerNumbers[player.name]
        
        if (partnerNum) {
          const partnerNames = Object.keys(partnerNumbers).filter(name => 
            partnerNumbers[name] === partnerNum
          )
          
          const oldPartnerNumbers = { ...partnerNumbers }
          const updatedPartners = { ...partnerNumbers }
          partnerNames.forEach(name => {
            updatedPartners[name] = null
          })
          setPartnerNumbers(updatedPartners)
          
          try {
            const updatePromises = partnerNames.map(name => {
              const user = userList.find(u => u.name === name)
              return fetch(`/api/write/players/${username}?mode=admin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  dupr_id: user?.dupr_id,
                  name: name,
                  partner_number: null,
                  original_dupr_id: user?.dupr_id
                })
              })
            })
            
            await Promise.all(updatePromises)
          } catch (apiError) {
            setPartnerNumbers(oldPartnerNumbers)
            throw apiError
          }
        }
      } else if (selectedArray.length === 2) {
        const player1 = userList[selectedArray[0]]
        const player2 = userList[selectedArray[1]]
        
        const usedNumbers = new Set(
          Object.values(partnerNumbers).filter(num => num !== null)
        )
        let nextNumber = 1
        while (usedNumbers.has(nextNumber)) {
          nextNumber++
        }

        const oldPartnerNumbers = { ...partnerNumbers }
        setPartnerNumbers(prev => ({
          ...prev,
          [player1.name]: nextNumber,
          [player2.name]: nextNumber
        }))
        
        try {
          await Promise.all([
            fetch(`/api/write/players/${username}?mode=admin`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dupr_id: player1.dupr_id,
                name: player1.name,
                partner_number: nextNumber,
                original_dupr_id: player1.dupr_id
              })
            }),
            fetch(`/api/write/players/${username}?mode=admin`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dupr_id: player2.dupr_id,
                name: player2.name,
                partner_number: nextNumber,
                original_dupr_id: player2.dupr_id
              })
            })
          ])
        } catch (apiError) {
          setPartnerNumbers(oldPartnerNumbers)
          throw apiError
        }
      }
      
      setSelectedPlayers(new Set())
    } catch (error) {
      console.error('Partner action error:', error)
    } finally {
      setIsUpdatingPartner(false)
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

  const handleDeleteAll = async () => {
    const confirmed = window.confirm('⚠️ 確定要刪除所有玩家資料嗎？此操作無法復原！')
    if (!confirmed) return

    const response = await fetch(`/api/write/players/${username}?delete_all=true&mode=admin`, {
      method: 'DELETE'
    })

    if (response.ok) {
      setUserList([])
      setDeleteMessage('✅ 所有玩家資料已刪除')
    } else {
      setDeleteMessage('❌ 刪除失敗，請稍後再試')
    }
  }

  const exportCSV = () => {
    const rows = userList.map(u => {
      const partnerNum = partnerNumbers[u.name]
      return [u.dupr_id, u.name, partnerNum || '']
    })
    const csvContent = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${username}_players.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      let text = event.target?.result as string
      
      if (text.includes('�') || /[\u00C0-\u00FF]/.test(text)) {
        const reader2 = new FileReader()
        reader2.onload = async (event2) => {
          const text2 = event2.target?.result as string
          processCSVText(text2)
        }
        reader2.readAsText(file, 'Big5')
        return
      }
      
      processCSVText(text)
    }

    const processCSVText = async (text: string) => {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
      const imported: (player_info & { partner_number?: number | null })[] = []

      lines.forEach(line => {
        const parts = line.split(',').map(s => s.trim())
        
        if (parts.length === 5) {
          const [partner_number, name1, dupr_id1, name2, dupr_id2] = parts
          const partnerNum = parseInt(partner_number)
          
          imported.push(
            { dupr_id: dupr_id1, name: name1, partner_number: partnerNum },
            { dupr_id: dupr_id2, name: name2, partner_number: partnerNum }
          )
        } else {
          const [dupr_id, name] = parts
          let partner_number: number | null = null
          
          if (parts.length >= 3 && parts[2]) {
            const partnerNum = parseInt(parts[2])
            if (!isNaN(partnerNum) && partnerNum > 0) {
              partner_number = partnerNum
            }
          }
          
          imported.push({ dupr_id, name, partner_number })
        }
      })

      await fetch(`/api/write/players/${username}?delete_all=true&mode=admin`, {
        method: 'DELETE'
      })
      
      setUserList([])
      setPartnerNumbers({})
      
      await saveUserToSupabase(imported)

      e.target.value = ''
    }

    reader.readAsText(file, 'UTF-8')
  }
  
  if (isLoading || loadingLockedNames) {
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
    <div className="max-w-md mx-auto px-4 pt-4">
      {/* 輸入區塊 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          className="border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          placeholder="DUPR ID"
          value={userInfo.dupr_id}
          onChange={(e) => {
            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
            if (value.length <= VALIDATION.DUPR_ID_LENGTH) {
              updateUserInfo('dupr_id', value)
            }
          }}
          type="text"
          inputMode="text"
          maxLength={VALIDATION.DUPR_ID_LENGTH}
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
            !VALIDATION.DUPR_ID_PATTERN.test(userInfo.dupr_id) || userInfo.name.trim() === ''
          }
          className={`rounded-md px-5 py-2 shadow flex-shrink-0 transition
            ${VALIDATION.DUPR_ID_PATTERN.test(userInfo.dupr_id) && userInfo.name.trim() !== ''
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
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
            onClick={() => hasActiveScores ? null : fileInputRef.current?.click()}
            disabled={hasActiveScores}
            className={`${hasActiveScores ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
            title={hasActiveScores ? "比賽進行中，無法匯入選手名單" : "匯入 CSV"}
          >
            <Upload size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={importCSV}
            className="hidden"
            disabled={hasActiveScores}
          />
        </div>
      </div>

      {/* 固定隊友按鈕 */}
      {deletePassword === storedPassword && getButtonText() && (
        <div className="mb-4 text-center">
          <button
            onClick={handlePartnerAction}
            disabled={isUpdatingPartner}
            className={`px-4 py-2 text-white rounded-md ${
              isUpdatingPartner 
                ? 'bg-gray-400 cursor-not-allowed'
                : getButtonText() === '解除固定' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isUpdatingPartner ? '處理中...' : getButtonText()}
          </button>
        </div>
      )}

      {/* 玩家列表 */}
      <PlayerList
        userList={userList}
        partnerNumbers={partnerNumbers}
        lockedNames={lockedNames}
        loadingLockedNames={loadingLockedNames}
        selectedPlayers={selectedPlayers}
        readonly={false}
        onEdit={editUser}
        onDelete={deleteUser}
        onToggleSelection={togglePlayerSelection}
      />

      {/* 管理員專用區塊 */}
      <div className="relative w-full my-6">
        <hr className="border-t border-gray-300" />
        <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-2 text-sm text-gray-500 italic">
          Organizer only
        </span>
      </div>

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

      {deleteMessage && <div className="text-center text-red-600 mt-1">{deleteMessage}</div>}
    </div>
  )
}