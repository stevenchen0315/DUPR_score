'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'
import { notFound } from 'next/navigation'
import MarqueeAd from '@/components/MarqueeAd'
import { supabase } from '@/lib/supabase'

export default function UserPage({ params }: any) {
  const [tab, setTab] = useState<'players' | 'scores'>('scores')
  const [allowedUsernames, setAllowedUsernames] = useState<string[] | null>(null)
  const [webEvent, setWebEvent] = useState<string>('')
  const [defaultMode, setDefaultMode] = useState<'admin' | 'readonly'>('admin')
  const username = params.username
  const searchParams = useSearchParams()
  
  // 決定最終模式
  const modeParam = searchParams.get('mode')
  const finalMode = modeParam || defaultMode
  const isReadOnly = finalMode === 'readonly'

  // 🔄 讀取 account 資料表中的所有 username、web_event 和 default_mode
  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const response = await fetch('/api/read/account')
        if (response.ok) {
          const data = await response.json()
          setAllowedUsernames(data.map((d: any) => d.username))
          // 找到對應的 web_event 和 default_mode
          const userAccount = data.find((d: any) => d.username === username)
          if (userAccount?.web_event) {
            setWebEvent(userAccount.web_event)
          }
          // NULL 或空字串都視為管理員模式
          const mode = userAccount?.default_mode === 'readonly' ? 'readonly' : 'admin'
          setDefaultMode(mode)
        } else {
          console.error('Failed to fetch usernames')
          setAllowedUsernames([])
        }
      } catch (error) {
        console.error('Failed to fetch usernames:', error)
        setAllowedUsernames([])
      }
    }

    fetchUsernames()
  }, [username])

  // ✅ 還沒載入完成就先不顯示頁面
  if (allowedUsernames === null) return null

  // ❌ 不在白名單 → 顯示 404
  if (!allowedUsernames.includes(username)) {
    notFound()
  }

  const capitalizeFirstLetter = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <div className="px-6 pt-3 pb-6">
      <header className="flex justify-between sm:justify-start sm:relative items-center mb-3 border-b pb-2">
        <a href={`/${username}`} className="text-2xl font-black text-blue-600 hover:text-blue-700 transition-colors" style={{fontWeight: 900, textShadow: '0 0 1px currentColor'}}>DUPLA</a>
      </header>

      <h1 className="text-xl sm:text-2xl font-bold text-blue-600 text-center mb-4 mt-2">
        {webEvent || `Organizer: ${capitalizeFirstLetter(username)}`}
      </h1>

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

      <div className="flex-grow">
        {tab === 'players' && <PlayerPage username={username} readonly={isReadOnly} />}
        {tab === 'scores' && <ScorePage username={username} readonly={isReadOnly} />}
      </div>

      <MarqueeAd />

      <footer className="text-center text-gray-500 text-sm mt-4 border-t pt-4">
        Copyright &copy; {new Date().getFullYear()}{' '}
        <a
          href="mailto:steven0315@kimo.com"
          className="text-blue-500 hover:underline"
        >
          Steven Chen
        </a>
      </footer>
    </div>
  )
}
