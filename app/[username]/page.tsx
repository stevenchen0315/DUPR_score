'use client'

import { useState } from 'react'
import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'
import { notFound } from 'next/navigation'

// ✅ 只允許的使用者名稱清單
const allowedUsernames = ['orange', 'steven']

export default function UserPage({ params }: any) {
  const [tab, setTab] = useState<'players' | 'scores'>('scores')
  const username = params.username

  // ❌ 不在白名單 → 顯示 404
  if (!allowedUsernames.includes(username)) {
    notFound()
  }

  // 第一個字母大寫的處理函數
  const capitalizeFirstLetter = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <div className="p-6">
      {/* 顯示使用者名稱 */}
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6 border-b pb-2">
        Organizer: {capitalizeFirstLetter(username)}
      </h1>

      {/* 切換按鈕 */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setTab('players')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition active:scale-95 ${
            tab === 'players'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          <div className="text-center leading-tight">
            <div>選手資料</div>
            <div className="text-xs">(Players)</div>
          </div>
        </button>
        <button
          onClick={() => setTab('scores')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition active:scale-95 ${
            tab === 'scores'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          <div className="text-center leading-tight">
            <div>比賽分數</div>
            <div className="text-xs">(Matches)</div>
          </div>
        </button>
      </div>

      {/* 主內容 */}
      <div className="flex-grow">
        {tab === 'players' && <PlayerPage username={username} />}
        {tab === 'scores' && <ScorePage username={username} />}
      </div>
      {/* Footer 區塊 */}
      <div className="text-center mt-12">
        <a
        href="https://XXX.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-yellow-100 text-yellow-800 font-semibold px-4 py-2 rounded-md shadow hover:bg-yellow-200 transition"
        >
          👉 點我入群
        </a>
      </div>
      
      <footer className="text-center text-gray-500 text-sm mt-8 border-t pt-4">
        Copyright &copy; {new Date().getFullYear()} Steven Chen
      </footer>
    </div>
  )
}
