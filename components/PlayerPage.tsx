'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { player_info } from '@/types'
import { FiEdit as Pencil, FiTrash2 as Trash2 } from 'react-icons/fi'

export default function PlayerPage({ username }: { username: string }) {
  const [userInfo, setUserInfo] = useState<player_info>({ dupr_id: '', name: '' })
  const [userList, setUserList] = useState<player_info[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null)

  // 根據 username 動態抓對應資料表
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from(`player_info_${username}`)
      .select('dupr_id, name')

    if (error) {
      console.error('Error fetching users:', error.message)
    } else {
      setUserList(data || [])
    }
  }

  useEffect(() => {
    fetchUsers()

    // 訂閱 Supabase Realtime（player_info 資料表）
    const playerChannel = supabase
      .channel(`realtime-player_info_${username}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: `player_info_${username}`,
        },
        () => {
          fetchUsers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playerChannel)
    }
  }, [username])
  
const saveUserToSupabase = async (list: player_info[]) => {
  try {
    const { error } = await supabase
      .from(`player_info_${username}`)
      .upsert(list, { onConflict: 'dupr_id' })
    if (error) throw error
  } catch (error: any) {
    console.error('Supabase save error:', error.message)
  }
}
  
  const updateUserInfo = (field: keyof player_info, value: string) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }))
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

  // 刪除資料庫中的該筆資料
const { error } = await supabase
    .from(`player_info_${username}`)
    .delete()
    .eq('dupr_id', deletedUser.dupr_id)

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
          onChange={(e) => updateUserInfo('dupr_id', e.target.value)}
          type="text"
          inputMode="text"
        />
        <input
          className="border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          placeholder="暱稱 (nickname)"
          value={userInfo.name}
          onChange={(e) => updateUserInfo('name', e.target.value)}
          type="text"
        />
        <button
          onClick={addUser}
          className="bg-blue-600 text-white rounded-md px-5 py-2 shadow hover:bg-blue-700 transition flex-shrink-0"
          aria-label={editIndex !== null ? '更新選手' : '新增選手'}
        >
          <div className="leading-tight text-center">
            <div>{editIndex !== null ? '更新選手' : '新增選手'}</div>
            <div className="text-xs">
              {editIndex !== null ? '(Update player)' : '(Add player)'}
            </div>
          </div>
        </button>
      </div>

      {/* 玩家列表 */}
      <ul className="space-y-4">
        {userList.map((user, idx) => (
          <li
            key={idx}
            className="flex justify-between items-center bg-white rounded-lg shadow p-4"
          >
            <div className="text-base font-medium text-gray-800">
              {user.name} <span className="text-sm text-gray-500">({user.dupr_id})</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => editUser(idx)}
                className="text-blue-500 hover:text-blue-700"
                aria-label={`編輯 ${user.name}`}
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={() => deleteUser(idx)}
                className="text-red-500 hover:text-red-700"
                aria-label={`刪除 ${user.name}`}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
