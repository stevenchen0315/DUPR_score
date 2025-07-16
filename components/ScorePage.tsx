'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { player_info, score } from '@/types'
import { FiPlus as Plus, FiDownload as Download, FiTrash2 as Trash2 } from 'react-icons/fi'
import { FaLock, FaLockOpen } from 'react-icons/fa'

const LOCKED = '鎖定'
const UNLOCKED = '解鎖'

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

  useEffect(() => {
    if (!username) return

    const fetchData = async () => {
      try {
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
        if (scores) setRows(formatScores(scores))
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

          if (data) setRows(formatScores(data))
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
    row.sd = teamACount === 1 && teamBCount === 1 ? 'S' : teamACount === 2 && teamBCount === 2 ? 'D' : ''

    setRows(newRows)

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

  return (
    <div>{/* 你的原本 JSX 保留 */}</div>
  )
}
