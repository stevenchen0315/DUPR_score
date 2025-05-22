// components/PlayerPage.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { player_info } from '@/types'
import { FiEdit as Pencil, FiTrash2 as Trash2 } from 'react-icons/fi'

export default function PlayerPage() {
  const [userInfo, setUserInfo] = useState<player_info>({ dupr_id: '', name: '' })
  const [userList, setUserList] = useState<player_info[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('player_info').select('dupr_id, name')
      if (error) console.error('Error fetching users:', error.message)
      else setUserList(data || [])
    }
    fetchUsers()
  }, [])

  const saveUserToSupabase = async (list: player_info[]) => {
    try {
      const { error: deleteError } = await supabase.from('player_info').delete().neq('dupr_id', '')
      if (deleteError) throw deleteError
      const { error: insertError } = await supabase.from('player_info').insert(list)
      if (insertError) throw insertError
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
    const updated = [...userList]
    updated.splice(index, 1)
    setUserList(updated)
    await saveUserToSupabase(updated)
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <input
          className="border px-2 py-1 flex-1"
          placeholder="DUPR ID"
          value={userInfo.dupr_id}
          onChange={(e) => updateUserInfo('dupr_id', e.target.value)}
        />
        <input
          className="border px-2 py-1 flex-1"
          placeholder="暱稱(nickname)"
          value={userInfo.name}
          onChange={(e) => updateUserInfo('name', e.target.value)}
        />
        <button
          onClick={addUser}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          {editIndex !== null ? '更新選手(Update Player)' : '新增選手(Add Player)'}
        </button>
      </div>

      <ul className="space-y-2">
        {userList.map((user, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span>{user.name} ({user.dupr_id})</span>
            <button onClick={() => editUser(idx)} className="text-blue-500"><Pencil size={16} /></button>
            <button onClick={() => deleteUser(idx)} className="text-red-500"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
    </div>
  )
}
