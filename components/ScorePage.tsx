'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { player_info, score } from '@/types'
import { FiPlus as Plus, FiDownload as Download, FiTrash2 as Trash2 } from 'react-icons/fi'

type CellField = 'D' | 'E' | 'F' | 'G'
type OtherField = 'h' | 'i' | 'lock' | 'sd'

type Row = {
  values: string[]
  sd: string
  h: string
  i: string
  lock: string
}

export default function ScorePage() {
  const [userList, setUserList] = useState<player_info[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')

  useEffect(() => {
  const fetchData = async () => {
    const { data: users } = await supabase.from('player_info').select('dupr_id, name')
    if (users) setUserList(users)

    const { data: scores } = await supabase.from('score').select('*').order('serial_number', { ascending: true })
    if (scores) setRows(formatScores(scores))
  }

  fetchData()

  const formatScores = (scores: score[]) => {
    return scores.map((item: score) => ({
      values: [item.player_a1, item.player_a2, item.player_b1, item.player_b2],
      h: item.team_a_score.toString(),
      i: item.team_b_score.toString(),
      lock: item.lock ? '鎖定' : '解鎖',
      sd:
        [item.player_a1, item.player_a2].filter(Boolean).length === 1 &&
        [item.player_b1, item.player_b2].filter(Boolean).length === 1
          ? 'S'
          : ([item.player_a1, item.player_a2].filter(Boolean).length === 2 &&
             [item.player_b1, item.player_b2].filter(Boolean).length === 2
            ? 'D'
            : ''),
    }))
  }

  // Supabase Realtime 訂閱
  const channel = supabase
    .channel('realtime-score')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'score' },
      async () => {
        const { data } = await supabase.from('score').select('*').order('serial_number', { ascending: true })
        if (data) setRows(formatScores(data))
      }
    )
    .subscribe()

  // 清除訂閱
  return () => {
    supabase.removeChannel(channel)
  }
}, [])

  const updateCell = async (rowIndex: number, field: CellField | OtherField, value: string) => {
    const newRows = [...rows]
    const row = newRows[rowIndex]

    if (['h', 'i', 'lock'].includes(field)) {
      if ((field === 'h' || field === 'i') && value !== '') {
        if (!/^\d{1,2}$/.test(value) || +value > 99) return
      }
      ;(row as any)[field] = value
    } else {
      const colIndex = { D: 0, E: 1, F: 2, G: 3 }[field as CellField]
      row.values[colIndex] = value
    }

    const [a1, a2, b1, b2] = row.values
    const teamACount = [a1, a2].filter(Boolean).length
    const teamBCount = [b1, b2].filter(Boolean).length
    row.sd = teamACount === 1 && teamBCount === 1 ? 'S' : (teamACount === 2 && teamBCount === 2 ? 'D' : '')

    setRows(newRows)

    await supabase.from('score').upsert({
      serial_number: rowIndex + 1,
      player_a1: a1,
      player_a2: a2,
      player_b1: b1,
      player_b2: b2,
      team_a_score: row.h === '' ? null : parseInt(row.h),
      team_b_score: row.i === '' ? null : parseInt(row.i),
      lock: row.lock === '鎖定'
    })
  }

  const deleteRow = async (index: number) => {
    const updated = [...rows]
    updated.splice(index, 1)
    setRows(updated)

    const payload = updated.map((row, idx) => {
      const [a1, a2, b1, b2] = row.values
      return {
        serial_number: idx + 1,
        player_a1: a1,
        player_a2: a2,
        player_b1: b1,
        player_b2: b2,
        team_a_score: parseInt(row.h) || 0,
        team_b_score: parseInt(row.i) || 0,
        lock: row.lock === '鎖定'
      }
    })

    await supabase.from('score').delete().neq('serial_number', 0)
    await supabase.from('score').insert(payload)
  }

  const addRow = () => {
    setRows([...rows, { values: ['', '', '', ''], sd: '', h: '', i: '', lock: '解鎖' }])
  }

  const getFilteredOptions = (row: Row, currentIndex: number) => {
    const selected = row.values.filter((v, i) => v && i !== currentIndex)
    return userList.map((u) => u.name).filter((n) => !selected.includes(n))
  }

  const exportCSV = () => {
    const today = new Date().toISOString().slice(0, 10)
    const findUser = (name: string): player_info => userList.find((u) => u.name === name) || { dupr_id: '', name: '' }
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

  const handleDeleteAll = async () => {
    const { error } = await supabase.from('score').delete().neq('serial_number', 0)
    if (!error) {
      setRows([])
      setDeleteMessage('✅ 所有比賽資料已刪除')
    } else {
      setDeleteMessage('❌ 刪除失敗，請稍後再試')
    }
  }

  return (
    <div>
      <table className="w-full border text-sm mb-6">
        <thead>
          <tr>
            <th className="border p-1">A1</th>
            <th className="border p-1">A2</th>
            <th className="border p-1">B1</th>
            <th className="border p-1">B2</th>
            <th className="border p-1">S/D</th>
            <th className="border p-1">Team A</th>
            <th className="border p-1">Team B</th>
            <th className="border p-1">狀態</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.values.map((val, i) => (
                <td key={i} className="border p-1">
                  <select
                    value={val}
                    disabled={row.lock === '鎖定'}
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
                  min="0"
                  max="99"
                  step="1"
                  value={row.h}
                  onChange={(e) => updateCell(rowIndex, 'h', e.target.value)}
                  disabled={row.lock === '鎖定'}
                  className="w-full border px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  value={row.i}
                  onChange={(e) => updateCell(rowIndex, 'i', e.target.value)}
                  disabled={row.lock === '鎖定'}
                  className="w-full border px-1"
                />
              </td>
              <td className="border p-1 text-center">
                <button
                  onClick={() => updateCell(rowIndex, 'lock', row.lock === '鎖定' ? '解鎖' : '鎖定')}
                  className={`px-2 py-1 rounded text-white ${row.lock === '鎖定' ? 'bg-red-500' : 'bg-gray-400'}`}
                >
                  {row.lock}
                </button>
              </td>
              <td className="border p-1 text-center">
                <button
                  onClick={() => deleteRow(rowIndex)}
                  disabled={row.lock === '鎖定'}
                  className={`px-2 py-1 rounded text-white ${row.lock === '鎖定' ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center mb-6">
        <button
          onClick={addRow}
          className="bg-green-600 text-white px-3 py-1 rounded inline-flex items-center w-40"
        >
          <Plus size={16} className="mr-1" /> 新增比賽組(Add Match)
        </button>

        <div className="mx-8" />

        <button
          onClick={exportCSV}
          className="bg-yellow-500 text-white px-4 py-2 rounded inline-flex items-center w-40"
        >
          <Download size={18} className="mr-2" /> 匯出 CSV
        </button>
      </div>

      <div className="flex justify-center mb-6 flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="password"
            placeholder="請輸入密碼"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <button
            onClick={handleDeleteAll}
            disabled={deletePassword !== '0315'}
            className={`px-3 py-1 rounded text-white ${
              deletePassword === '0315'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            一鍵刪除
          </button>
        </div>
        {deleteMessage && <div className="text-red-600">{deleteMessage}</div>}
      </div>
    </div>
  )
}
