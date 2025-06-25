'use client'

import { useState } from 'react'
import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'

export default function UserPage({ params }: any) {
  const [tab, setTab] = useState<'players' | 'scores'>('scores')
  const username = params.username

  // 第一個字母大寫的處理函數
  const capitalizeFirstLetter = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <div className="p-6">
      {/* 顯示使用者名稱 */}
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6 border-b pb-2">
        Organizers: {capitalizeFirstLetter(username)}
      </h1>

      {/* 切換按鈕 */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setTab('players')}
          className={`px-4 py-2 rounded ${tab === 'players' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          選手資料
        </button>
        <button
          onClick={() => setTab('scores')}
          className={`px-4 py-2 rounded ${tab === 'scores' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          比賽分數
        </button>
      </div>

      {/* 主內容 */}
      {tab === 'players' && <PlayerPage username={username} />}
      {tab === 'scores' && <ScorePage username={username} />}
    </div>
  )
}
