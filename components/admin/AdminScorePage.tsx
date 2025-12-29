'use client'

import { useState, useMemo, useEffect } from 'react'
import { useScoreData } from '@/hooks/useScoreData'
import { FiPlus as Plus, FiDownload as Download } from 'react-icons/fi'
import { createFilteredRows, handleFilterChange as utilHandleFilterChange } from '@/lib/constants'
import { useDebouncedCallback, usePlayerFilter, useScrollToTop } from '@/lib/utils'
import { generateRoundRobin } from '@/lib/tournament'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ScrollToTopButton from '@/components/shared/ScrollToTopButton'
import PlayerFilter from '@/components/shared/PlayerFilter'
import UnifiedScoreTable from '@/components/shared/UnifiedScoreTable'

type CellField = 'D' | 'E' | 'F' | 'G'

interface AdminScorePageProps {
  username: string
  defaultMode?: string
}

export default function AdminScorePage({ username, defaultMode = 'dupr' }: AdminScorePageProps) {
  const {
    userList,
    rows,
    storedPassword,
    eventName,
    isLoading,
    realtimeConnected,
    partnerNumbers,
    lastLocalUpdateRef,
    setRows,
    setEventName
  } = useScoreData(username)

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMatch, setNewMatch] = useState({
    a1: '', a2: '', b1: '', b2: '', scoreA: '', scoreB: '', check: false
  })
  const [showTournamentModal, setShowTournamentModal] = useState(false)
  const [tournamentConfig, setTournamentConfig] = useState({
    selectedPlayers: [] as string[]
  })
  
  const { selectedPlayerFilter, setSelectedPlayerFilter, FILTER_STORAGE_KEY } = usePlayerFilter(username, userList)
  const showScrollTop = useScrollToTop()
  
  const LOCKED = 'Locked'
  const isOpenMode = defaultMode === 'open'

  const filteredRows = useMemo(() => createFilteredRows(rows, selectedPlayerFilter), [rows, selectedPlayerFilter])

  const rankings = useMemo(() => {
    if (filteredRows.length === 0) return []
    
    const playerStats: {[playerName: string]: {
      wins: number
      losses: number
      pointsFor: number
      pointsAgainst: number
      matches: Array<{
        opponent: string[]
        won: boolean
        scoreFor: number
        scoreAgainst: number
      }>
    }} = {}
    
    const validMatches = filteredRows.filter(row => 
      row.lock === LOCKED && 
      row.h !== '' && 
      row.i !== '' &&
      row.values.some((v: string) => v.trim())
    )
    
    validMatches.forEach(row => {
      const [a1, a2, b1, b2] = row.values
      const scoreA = parseInt(row.h)
      const scoreB = parseInt(row.i)
      
      if (isNaN(scoreA) || isNaN(scoreB)) return
      
      const teamA = [a1, a2].filter(Boolean)
      const teamB = [b1, b2].filter(Boolean)
      
      if (teamA.length === 0 || teamB.length === 0) return
      
      const teamAWon = scoreA > scoreB
      
      teamA.forEach(player => {
        if (!playerStats[player]) {
          playerStats[player] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, matches: [] }
        }
        playerStats[player].wins += teamAWon ? 1 : 0
        playerStats[player].losses += teamAWon ? 0 : 1
        playerStats[player].pointsFor += scoreA
        playerStats[player].pointsAgainst += scoreB
        playerStats[player].matches.push({
          opponent: teamB,
          won: teamAWon,
          scoreFor: scoreA,
          scoreAgainst: scoreB
        })
      })
      
      teamB.forEach(player => {
        if (!playerStats[player]) {
          playerStats[player] = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, matches: [] }
        }
        playerStats[player].wins += teamAWon ? 0 : 1
        playerStats[player].losses += teamAWon ? 1 : 0
        playerStats[player].pointsFor += scoreB
        playerStats[player].pointsAgainst += scoreA
        playerStats[player].matches.push({
          opponent: teamA,
          won: !teamAWon,
          scoreFor: scoreB,
          scoreAgainst: scoreA
        })
      })
    })
    
    let rankingList = Object.entries(playerStats).map(([name, stats]) => ({
      name,
      wins: stats.wins,
      losses: stats.losses,
      pointDiff: stats.pointsFor - stats.pointsAgainst,
      matches: stats.matches,
      h2hWins: 0,
      h2hPointDiff: 0
    }))
    
    const groupsByWins: {[wins: number]: typeof rankingList} = {}
    rankingList.forEach(player => {
      if (!groupsByWins[player.wins]) groupsByWins[player.wins] = []
      groupsByWins[player.wins].push(player)
    })
    
    const sortedRanking: typeof rankingList = []
    Object.keys(groupsByWins).sort((a, b) => parseInt(b) - parseInt(a)).forEach(winsStr => {
      const wins = parseInt(winsStr)
      const group = groupsByWins[wins]
      
      if (group.length === 1) {
        sortedRanking.push(...group)
      } else {
        const groupNames = group.map(p => p.name)
        
        group.forEach(player => {
          const h2hMatches = player.matches.filter(m => 
            m.opponent.some(opp => groupNames.includes(opp))
          )
          player.h2hWins = h2hMatches.filter(m => m.won).length
          player.h2hPointDiff = h2hMatches.reduce((sum, m) => sum + (m.scoreFor - m.scoreAgainst), 0)
        })
        
        group.sort((a, b) => {
          if (a.h2hWins !== b.h2hWins) return b.h2hWins - a.h2hWins
          if (a.h2hPointDiff !== b.h2hPointDiff) return b.h2hPointDiff - a.h2hPointDiff
          return b.pointDiff - a.pointDiff
        })
        
        sortedRanking.push(...group)
      }
    })
    
    return sortedRanking.slice(0, 8)
  }, [filteredRows])

  const debouncedSave = useDebouncedCallback(async (row: any, isLockingAction: boolean = false) => {
    lastLocalUpdateRef.current = Date.now()
    const [a1, a2, b1, b2] = row.values
    const updateData: any = {
      serial_number: `${row.serial_number}_${username}`,
      player_a1: a1,
      player_a2: a2,
      player_b1: b1,
      player_b2: b2,
      team_a_score: row.h === '' ? null : parseInt(row.h),
      team_b_score: row.i === '' ? null : parseInt(row.i),
      lock: row.lock === LOCKED,
      check: row.check
    }
    
    if (isLockingAction && row.lock === LOCKED) {
      updateData.updated_time = new Date().toISOString()
    }
    
    await fetch(`/api/write/scores/${username}?mode=admin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
  }, 500)

  const updateCell = (rowIndex: number, field: string, value: string) => {
    const targetRow = filteredRows[rowIndex]
    const originalIndex = rows.findIndex(r => r.serial_number === targetRow.serial_number)
    const isLockingAction = field === 'lock' && value === LOCKED
    
    const newRows = rows.map((r, i) => {
      if (i !== originalIndex) return r

      const updatedRow: any = {
        ...r,
        values: [...r.values]
      }

      if (['h', 'i', 'lock', 'check'].includes(field)) {
        if ((field === 'h' || field === 'i') && value !== '') {
          if (!/^\d{1,2}$/.test(value) || +value > 99) return r
        }
        if (field === 'check') {
          updatedRow.check = value === 'true'
        } else {
          updatedRow[field] = value
        }
        
        if (isLockingAction && value === LOCKED) {
          updatedRow.updated_time = new Date().toISOString()
        }
      } else {
        const colIndex = { D: 0, E: 1, F: 2, G: 3 }[field as CellField]
        const oldValue = updatedRow.values[colIndex]
        updatedRow.values[colIndex] = value
        
        if (value && partnerNumbers[value]) {
          const partnerNum = partnerNumbers[value]
          const partnerName = Object.keys(partnerNumbers).find(name => 
            name !== value && partnerNumbers[name] === partnerNum
          )
          
          if (partnerName) {
            if (colIndex === 0) updatedRow.values[1] = partnerName
            else if (colIndex === 1) updatedRow.values[0] = partnerName
            else if (colIndex === 2) updatedRow.values[3] = partnerName
            else if (colIndex === 3) updatedRow.values[2] = partnerName
          }
        } else if (value && !partnerNumbers[value]) {
          if (oldValue && partnerNumbers[oldValue]) {
            if (colIndex === 0) updatedRow.values[1] = ''
            else if (colIndex === 1) updatedRow.values[0] = ''
            else if (colIndex === 2) updatedRow.values[3] = ''
            else if (colIndex === 3) updatedRow.values[2] = ''
          }
        } else if (!value) {
          let partnerIndex = -1
          if (colIndex === 0) partnerIndex = 1
          else if (colIndex === 1) partnerIndex = 0
          else if (colIndex === 2) partnerIndex = 3
          else if (colIndex === 3) partnerIndex = 2
          
          if (partnerIndex >= 0) {
            const partnerValue = updatedRow.values[partnerIndex]
            if (partnerValue && partnerNumbers[partnerValue] && oldValue && partnerNumbers[oldValue] && 
                partnerNumbers[partnerValue] === partnerNumbers[oldValue]) {
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
    debouncedSave(newRows[originalIndex], isLockingAction)
  }

  const deleteRow = async (index: number) => {
    const row = filteredRows[index]
    const originalIndex = rows.findIndex(r => r.serial_number === row.serial_number)
    const updated = [...rows]; updated.splice(originalIndex, 1); setRows(updated)
    
    await fetch(`/api/write/scores/${username}?serial_number=${row.serial_number}_${username}&mode=admin`, {
      method: 'DELETE'
    })
  }

  const addRow = async () => {
    const nextSerial = rows.length > 0 ? Math.max(...rows.map(r => r.serial_number)) + 1 : 1
    const payload = {
      serial_number: `${nextSerial}_${username}`,
      player_a1: '', player_a2: '', player_b1: '', player_b2: '',
      team_a_score: null, team_b_score: null, lock: false, check: false
    }
    const response = await fetch(`/api/write/scores/${username}?mode=admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (response.ok) {
      const newRow: any = {
        serial_number: nextSerial,
        values: ['', '', '', ''],
        h: '',
        i: '',
        lock: 'Unlocked',
        check: false,
        sd: ''
      }
      setRows(prev => [...prev, newRow])
    }
  }

  const openAddModal = () => {
    setNewMatch({ a1: '', a2: '', b1: '', b2: '', scoreA: '', scoreB: '', check: false })
    setShowAddModal(true)
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setNewMatch({ a1: '', a2: '', b1: '', b2: '', scoreA: '', scoreB: '', check: false })
  }

  const submitNewMatch = async () => {
    const nextSerial = rows.length > 0 ? Math.max(...rows.map(r => r.serial_number)) + 1 : 1
    
    const teamACount = [newMatch.a1, newMatch.a2].filter(Boolean).length
    const teamBCount = [newMatch.b1, newMatch.b2].filter(Boolean).length
    const sd = teamACount === 1 && teamBCount === 1 ? 'S' : teamACount === 2 && teamBCount === 2 ? 'D' : ''
    
    const newRow: any = {
      serial_number: nextSerial,
      values: [newMatch.a1, newMatch.a2, newMatch.b1, newMatch.b2],
      h: newMatch.scoreA,
      i: newMatch.scoreB,
      lock: LOCKED,
      check: newMatch.check,
      sd: sd,
      updated_time: new Date().toISOString()
    }
    
    setRows(prev => [...prev, newRow])
    closeAddModal()
    
    lastLocalUpdateRef.current = Date.now()
    
    const payload = {
      serial_number: `${nextSerial}_${username}`,
      player_a1: newMatch.a1,
      player_a2: newMatch.a2,
      player_b1: newMatch.b1,
      player_b2: newMatch.b2,
      team_a_score: newMatch.scoreA ? parseInt(newMatch.scoreA) : null,
      team_b_score: newMatch.scoreB ? parseInt(newMatch.scoreB) : null,
      lock: true,
      check: newMatch.check,
      updated_time: new Date().toISOString()
    }
    
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/write/scores/${username}?mode=admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
          setRows(prev => prev.filter(row => row.serial_number !== nextSerial))
          alert('儲存失敗，請重試')
        }
      } catch (error) {
        setRows(prev => prev.filter(row => row.serial_number !== nextSerial))
        alert('網路錯誤，請重試')
      }
    }, 0)
  }

  const handleNewMatchChange = (field: string, value: string) => {
    if ((field === 'scoreA' || field === 'scoreB') && value !== '') {
      if (!/^\d{1,2}$/.test(value) || +value > 21) return
    }
    
    setNewMatch(prev => ({ ...prev, [field]: value }))
    
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
    }
  }

  const getAvailableOptions = (excludeFields: string[]) => {
    const selected = excludeFields.map(field => newMatch[field as keyof typeof newMatch]).filter(Boolean)
    return userList.map(u => u.name).filter(name => !selected.includes(name))
      .sort((a, b) => {
        const aPartner = partnerNumbers[a] || 999
        const bPartner = partnerNumbers[b] || 999
        if (aPartner !== bPartner) return aPartner - bPartner
        return a.localeCompare(b)
      })
  }

  const validateNewMatch = () => {
    const { a1, a2, b1, b2, scoreA, scoreB } = newMatch
    
    const teamACount = [a1, a2].filter(Boolean).length
    const teamBCount = [b1, b2].filter(Boolean).length
    
    if (teamACount === 0 || teamBCount === 0) return false
    if (!scoreA || !scoreB) return false
    if ((teamACount === 2 && teamBCount === 1) || (teamACount === 1 && teamBCount === 2)) return false
    if (teamACount === 1 && teamBCount === 1) {
      if (!a1 || !b1 || a2 || b2) return false
    }
    
    return true
  }

  const handleDeleteAll = async () => {
    const confirmed = window.confirm('⚠️ 確定要刪除所有比賽資料嗎？此操作無法復原！')
    if (!confirmed) return

    const response = await fetch(`/api/write/scores/${username}?delete_all=true&mode=admin`, {
      method: 'DELETE'
    })
    if (response.ok) {
      setRows([])
      setDeleteMessage('✅ 所有比賽資料已刪除')
    } else {
      setDeleteMessage('❌ 刪除失敗，請稍後再試')
    }
  }

  const getFilteredOptions = (row: any, currentIndex: number) => {
    const selected = row.values.filter((v: string, i: number) => v && i !== currentIndex)
    return userList.map((u) => u.name).filter((n) => !selected.includes(n))
      .sort((a, b) => {
        const aPartner = partnerNumbers[a] || 999
        const bPartner = partnerNumbers[b] || 999
        if (aPartner !== bPartner) return aPartner - bPartner
        return a.localeCompare(b)
      })
  }



  const exportCSV = () => {
    const today = new Date().toISOString().slice(0, 10)

    const cleanDuprId = (text: string) => text.replace(`_${username}`, '')

    const findUser = (name: string) => {
      const user = userList.find((u) => u.name === name)
      return user ? { dupr_id: cleanDuprId(user.dupr_id), name: user.name } : { dupr_id: '', name: '' }
    }

    const csvRows = rows
      .filter(row => !row.check)
      .map((row) => {
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

  const handleFilterChange = (value: string) => {
    utilHandleFilterChange(value, setSelectedPlayerFilter, FILTER_STORAGE_KEY)
  }

  const generateTournament = async () => {
    const matches = generateRoundRobin(tournamentConfig.selectedPlayers)
    if (matches.length === 0) {
      alert('無法生成賽程，請檢查選手人數設定')
      return
    }

    const nextSerial = rows.length > 0 ? Math.max(...rows.map(r => r.serial_number)) + 1 : 1
    
    const newRows = matches.map((match, index) => ({
      serial_number: nextSerial + index,
      values: [...match.teamA, ...match.teamB],
      h: '',
      i: '',
      lock: 'Unlocked',
      check: false,
      sd: 'D'
    }))

    setRows(prev => [...prev, ...newRows])
    setShowTournamentModal(false)
    
    // 批量新增到資料庫
    try {
      await Promise.all(newRows.map(async (row, index) => {
        const payload = {
          serial_number: `${nextSerial + index}_${username}`,
          player_a1: row.values[0],
          player_a2: row.values[1],
          player_b1: row.values[2],
          player_b2: row.values[3],
          team_a_score: null,
          team_b_score: null,
          lock: false,
          check: false
        }
        
        const response = await fetch(`/api/write/scores/${username}?mode=admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) throw new Error('API Error')
      }))
      
      alert(`成功生成 ${matches.length} 場比賽！`)
    } catch (error) {
      alert('部分比賽新增失敗，請重試')
      // 回滾本地狀態
      setRows(prev => prev.filter(row => row.serial_number < nextSerial))
    }
  }

  const togglePlayerSelection = (playerName: string) => {
    setTournamentConfig(prev => ({
      ...prev,
      selectedPlayers: prev.selectedPlayers.includes(playerName)
        ? prev.selectedPlayers.filter(p => p !== playerName)
        : [...prev.selectedPlayers, playerName]
    }))
  }

  useEffect(() => {
    if (!isLoading && realtimeConnected) {
      setTimeout(() => {
        const mobileButton = document.getElementById('add-match-button-mobile')
        const desktopButton = document.getElementById('add-match-button-desktop')
        const targetButton = mobileButton || desktopButton
        if (targetButton) {
          targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)
    }
  }, [isLoading, realtimeConnected])




  
  if (isLoading || !realtimeConnected) {
    return <LoadingSpinner />
  }

  return (
    <div className="px-2 sm:px-4">
      <UnifiedScoreTable
        filteredRows={filteredRows}
        selectedPlayerFilter={selectedPlayerFilter}
        partnerNumbers={partnerNumbers}
        isOpenMode={isOpenMode}
        readonly={false}
        onUpdateCell={updateCell}
        onDeleteRow={deleteRow}
        getFilteredOptions={getFilteredOptions}
        deletePassword={deletePassword}
        storedPassword={storedPassword}
      />

      {/* 排名表格 - 只在桌面版顯示 */}
      {rankings.length > 0 && (
        <div className="hidden md:block mt-8 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-center">排名 (Rankings)</h3>
          <div className="overflow-auto">
            <table className="w-full border text-sm max-w-4xl mx-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-center">排名</th>
                  <th className="border p-2">選手</th>
                  <th className="border p-2 text-center">勝場</th>
                  <th className="border p-2 text-center">敗場</th>
                  <th className="border p-2 text-center">PD</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((player, index) => (
                  <tr key={player.name} className={index < 3 ? 'bg-yellow-50' : ''}>
                    <td className="border p-2 text-center font-bold">
                      {index + 1}
                    </td>
                    <td className="border p-2">
                      {partnerNumbers[player.name] ? `(${partnerNumbers[player.name]}) ` : ''}{player.name}
                    </td>
                    <td className="border p-2 text-center font-semibold text-green-600">
                      {player.wins}
                    </td>
                    <td className="border p-2 text-center text-red-600">
                      {player.losses}
                    </td>
                    <td className="border p-2 text-center font-semibold">
                      {player.pointDiff > 0 ? '+' : ''}{player.pointDiff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center mb-6 space-y-4">
        <PlayerFilter
          selectedPlayerFilter={selectedPlayerFilter}
          onFilterChange={handleFilterChange}
          rows={rows}
          partnerNumbers={partnerNumbers}
          filteredRowsLength={filteredRows.length}
        />

        {/* 手機版按鈕 */}
        <div className="md:hidden flex flex-col space-y-2">
          <button
            id="add-match-button-mobile"
            onClick={openAddModal}
            className="bg-green-600 text-white px-3 py-1 rounded w-36 flex justify-center"
          >
            <div className="flex items-center">
              <Plus size={16} className="mr-2" />
              <div className="leading-tight text-left">
                <div>添加比賽</div>
                <div className="text-xs">(Add Match)</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setShowTournamentModal(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded w-36 flex justify-center"
          >
            <div className="leading-tight text-center">
              <div>循環賽</div>
              <div className="text-xs">(Tournament)</div>
            </div>
          </button>
        </div>

        {/* 桌面版按鈕 */}
        <div className="hidden md:flex space-x-3">
          <button
            id="add-match-button-desktop"
            onClick={addRow}
            className="bg-green-600 text-white px-3 py-1 rounded w-36 flex justify-center"
          >
            <div className="flex items-center">
              <Plus size={16} className="mr-2" />
              <div className="leading-tight text-left">
                <div>添加比賽</div>
                <div className="text-xs">(Add Match)</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setShowTournamentModal(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded w-36 flex justify-center"
          >
            <div className="leading-tight text-center">
              <div>循環賽</div>
              <div className="text-xs">(Tournament)</div>
            </div>
          </button>
        </div>
          
        {/* 管理員專用區塊 */}
        <div className="relative w-full my-4">
          <hr className="border-t border-gray-300" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-2 text-sm text-gray-500 italic">
            Organizer only
          </span>
        </div>
          
        <div className="flex items-center space-x-3">
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

        {deleteMessage && <div className="text-red-600">{deleteMessage}</div>}
      </div>

      <ScrollToTopButton show={showScrollTop} />

      {/* 新增比賽 Modal */}
      {showAddModal && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">新增比賽(New Match)</h2>
              <button onClick={closeAddModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {/* Team A */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Team A</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-3">
                    <select
                      value={newMatch.a1}
                      onChange={(e) => handleNewMatchChange('a1', e.target.value)}
                      className="w-full border rounded px-4 py-3 text-base"
                    >
                      <option value="">--</option>
                      {getAvailableOptions(['a2', 'b1', 'b2']).map(name => (
                        <option key={name} value={name}>
                          {partnerNumbers[name] ? `(${partnerNumbers[name]}) ` : ''}{name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newMatch.a2}
                      onChange={(e) => handleNewMatchChange('a2', e.target.value)}
                      className="w-full border rounded px-4 py-3 text-base"
                    >
                      <option value="">--</option>
                      {getAvailableOptions(['a1', 'b1', 'b2']).map(name => (
                        <option key={name} value={name}>
                          {partnerNumbers[name] ? `(${partnerNumbers[name]}) ` : ''}{name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-xs text-gray-600 mb-1 text-center">分數(Score)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      max="21"
                      step="1"
                      value={newMatch.scoreA}
                      onChange={(e) => handleNewMatchChange('scoreA', e.target.value)}
                      className="w-full border rounded px-3 py-2 text-center text-lg font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-300 my-4"></div>

              {/* Team B */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Team B</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-3">
                    <select
                      value={newMatch.b1}
                      onChange={(e) => handleNewMatchChange('b1', e.target.value)}
                      className="w-full border rounded px-4 py-3 text-base"
                    >
                      <option value="">--</option>
                      {getAvailableOptions(['a1', 'a2', 'b2']).map(name => (
                        <option key={name} value={name}>
                          {partnerNumbers[name] ? `(${partnerNumbers[name]}) ` : ''}{name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newMatch.b2}
                      onChange={(e) => handleNewMatchChange('b2', e.target.value)}
                      className="w-full border rounded px-4 py-3 text-base"
                    >
                      <option value="">--</option>
                      {getAvailableOptions(['a1', 'a2', 'b1']).map(name => (
                        <option key={name} value={name}>
                          {partnerNumbers[name] ? `(${partnerNumbers[name]}) ` : ''}{name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-xs text-gray-600 mb-1 text-center">分數(Score)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      max="21"
                      step="1"
                      value={newMatch.scoreB}
                      onChange={(e) => handleNewMatchChange('scoreB', e.target.value)}
                      className="w-full border rounded px-3 py-2 text-center text-lg font-semibold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border-t">
              {isOpenMode && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newMatch.check}
                    onChange={(e) => setNewMatch(prev => ({ ...prev, check: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-600">棄賽(WD)</label>
                </div>
              )}
              
              <div className={`flex space-x-3 ${!isOpenMode ? 'w-full justify-end' : ''}`}>
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

      {/* 循環賽設定 Modal */}
      {showTournamentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">循環賽設定</h2>
              <button 
                onClick={() => setShowTournamentModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇選手 ({tournamentConfig.selectedPlayers.length} 人)
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  系統會根據人數自動安排最佳場數，選手只能選4-8位
                </div>
                <div className="max-h-48 overflow-y-auto border rounded p-2">
                  {userList.map(user => (
                    <div key={user.name} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={tournamentConfig.selectedPlayers.includes(user.name)}
                        onChange={() => togglePlayerSelection(user.name)}
                        className="w-4 h-4"
                      />
                      <label className="text-sm">
                        {partnerNumbers[user.name] ? `(${partnerNumbers[user.name]}) ` : ''}{user.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t">
              <button
                onClick={() => setShowTournamentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={generateTournament}
                disabled={tournamentConfig.selectedPlayers.length < 4}
                className={`px-4 py-2 rounded ${
                  tournamentConfig.selectedPlayers.length >= 4
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                生成賽程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
