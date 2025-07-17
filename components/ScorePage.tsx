'use client'

import { useEffect, useState } from 'react'
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

export default function ScorePage({ username }: { username: string }) {
  const [userList, setUserList] = useState<player_info[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [storedPassword, setStoredPassword] = useState<string>('')

  useEffect(() => {
    if (!username) return

    const fetchData = async () => {
      try {
        const { data: account, error: accountError } = await supabase
          .from('account')
          .select('password')
          .eq('username', username)
          .single()

        if (accountError) throw accountError
        if (account?.password) setStoredPassword(account.password)
        
        const { data: users, error: userError } = await supabase
          .from('player_info')
          .select('dupr_id, name')
          .like('dupr_id', `%_${username}`)

        if (userError) throw userError
        if (users) {
          setUserList(users.map(u => ({ ...u, name: u.name.replace(`_${username}`, '') })))
        }

        const { data: scores, error: scoreError } = await supabase
          .from('score')
          .select('*')
          .like('serial_number', `%_${username}`)

        if (scoreError) throw scoreError
        if (scores) {
          const sorted = scores.sort((a, b) => parseInt(a.serial_number) - parseInt(b.serial_number))
          setRows(formatScores(sorted))
        }
      } catch (error) {
        console.error('Fetch error:', error)
      }
    }

    fetchData()

    const channel = supabase
      .channel(`realtime-score-${username}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'score' },
        async () => {
          const { data } = await supabase
            .from('score')
            .select('*')
            .like('serial_number', `%_${username}`)

          if (data) {
            const sorted = data.sort((a, b) => parseInt(a.serial_number) - parseInt(b.serial_number))
            setRows(formatScores(sorted))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [username])

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

  const updateCell = async (rowIndex: number, field: CellField | OtherField, value: string) => {
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
        updatedRow.values[colIndex] = value
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
  }

  const deleteRow = async (index: number) => {
    const updated = [...rows]
    updated.splice(index, 1)
    setRows(updated)

    await supabase.from('score').delete().like('serial_number', `%_${username}`)

    const payload = updated.map((row) => {
      const [a1, a2, b1, b2] = row.values
      return {
        serial_number: `${row.serial_number}_${username}`,
        player_a1: a1,
        player_a2: a2,
        player_b1: b1,
        player_b2: b2,
        team_a_score: row.h === '' ? null : parseInt(row.h),
        team_b_score: row.i === '' ? null : parseInt(row.i),
        lock: row.lock === LOCKED
      }
    })

    await supabase.from('score').insert(payload)
  }

  const addRow = () => {
    const nextSerial = rows.length > 0 ? Math.max(...rows.map((r) => r.serial_number)) + 1 : 1
    setRows([
      ...rows,
      {
        serial_number: nextSerial,
        values: ['', '', '', ''],
        sd: '',
        h: '',
        i: '',
        lock: UNLOCKED
      }
    ])
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
    return userList.map((u) => u.name).filter((n) => !selected.includes(n))
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
      '', '', '', row.sd, '', today,
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
  a.download = `export-${today}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

return (
    <div>
      <table className="w-full border text-sm mb-6">
        <thead>
          <tr>
            <th className="border p-1">#</th> {/* serial number */}
            <th className="border p-1">A1</th>
            <th className="border p-1">A2</th>
            <th className="border p-1">B1</th>
            <th className="border p-1">B2</th>
            <th className="border p-1">S/D</th>
            <th className="border p-1">A Score</th>
            <th className="border p-1">B Score</th>
            <th className="border p-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td className="border p-1 text-center font-medium">{row.serial_number}</td> {/* ← 顯示 serial_number */}
              {row.values.map((val, i) => (
                <td key={i} className="border p-1">
                  <select
                    value={val}
                    disabled={row.lock === 'Locked'}
                    onChange={(e) => updateCell(rowIndex, ['D', 'E', 'F', 'G'][i] as CellField, e.target.value)}
                  >
                    <option value="">--</option>
                    {getFilteredOptions(row, i).map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
              ))}
              <td className="border p-1">{row.sd}</td>
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
                  className="w-full border px-1"
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
                  className="w-full border px-1"
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

  <div className="flex flex-col items-center mb-6 space-y-4">
  {/* 添加比賽按鈕 */}
  <button
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
      disabled={deletePassword !== storedPassword}
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
  {deleteMessage && <div className="text-red-600">{deleteMessage}</div>}
  </div>
  </div>
  )
}
