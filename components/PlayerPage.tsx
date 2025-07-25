'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { player_info } from '@/types'
import { FiEdit as Pencil, FiTrash2 as Trash2 } from 'react-icons/fi'

export default function PlayerPage({ username }: { username: string }) {
  const [userInfo, setUserInfo] = useState<player_info>({ dupr_id: '', name: '' })
  const [userList, setUserList] = useState<player_info[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [lockedNames, setLockedNames] = useState<Set<string>>(new Set())
  const [canEdit, setCanEdit] = useState(true) // 你可以根據情境改變這個狀態
  const [loadingLockedNames, setLoadingLockedNames] = useState(true)
  const suffix = `_${username}`
  
useEffect(() => {
    if (!username) return
  
  const fetchData = async () => {
      try {
        // 讀取 player_info 名單
        const { data: users, error: userError } = await supabase
          .from('player_info')
          .select('dupr_id, name')
          .like('dupr_id', `%_${username}`)

        if (userError) throw userError
        if (users) {
          setUserList(
            users.map(u => ({
              dupr_id: u.dupr_id.replace(`_${username}`, ''),
              name: u.name,
            }))
          )
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

      } catch (error) {
        console.error('Fetch error:', error)
        setLoadingLockedNames(false)
      }
    }

    fetchData()
  }, [username])

  const saveUserToSupabase = async (list: player_info[]) => {
    try {
      const transformed = list.map(user => ({
        dupr_id: `${user.dupr_id.toUpperCase()}${suffix}`,
        name: user.name,
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
        <div className="text-sm text-gray-500 mt-1 ml-1">
          {userList.length} players
        </div>
      </div>

      {/* 玩家列表 */}
      <ul className="space-y-4">
        {userList.map((user, idx) => {
          const isLocked = lockedNames.has(user.name)

          return (
            <li key={idx} className="flex justify-between items-center bg-white rounded-lg shadow p-4">
              <div className="text-base font-medium text-gray-800">
                {user.name} <span className="text-sm text-gray-500">({user.dupr_id})</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => editUser(idx)}
                  disabled={loadingLockedNames || isLocked}
                  className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  aria-label={`編輯 ${user.name}`}
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={() => deleteUser(idx)}
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
    </div>
  )
}
