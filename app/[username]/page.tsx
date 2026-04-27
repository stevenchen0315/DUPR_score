'use client'

import { useState, useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'
import ReadonlyPlayerPage from '@/components/readonly/ReadonlyPlayerPage'
import AdminPlayerPage from '@/components/admin/AdminPlayerPage'
import ReadonlyScorePage from '@/components/readonly/ReadonlyScorePage'
import AdminScorePage from '@/components/admin/AdminScorePage'
import { notFound } from 'next/navigation'
import MarqueeAd from '@/components/MarqueeAd'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/i18n'

export default function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [tab, setTab] = useState<'players' | 'scores'>('scores')
  const [allowedUsernames, setAllowedUsernames] = useState<string[] | null>(null)
  const [webEvent, setWebEvent] = useState<string>('')
  const [defaultMode, setDefaultMode] = useState<'admin' | 'readonly'>('admin')
  const [userDefaultMode, setUserDefaultMode] = useState<string>('dupr')
  const searchParams = useSearchParams()
  const { lang, toggle, t } = useLanguage()
  
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
          // 保存原始的 default_mode
          setUserDefaultMode(userAccount?.default_mode || 'dupr')
          // 決定 readonly 模式
          const mode = userAccount?.default_mode === 'open' ? 'readonly' : 'admin'
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
      <header className="flex justify-between items-center mb-3 border-b pb-2">
        <a href={`/${username}`} className="text-2xl font-black text-blue-600 hover:text-blue-700 transition-colors" style={{fontWeight: 900, textShadow: '0 0 1px currentColor'}}>DUPLA</a>
        <button
          onClick={toggle}
          className="px-2.5 py-1 text-sm border rounded-md hover:bg-gray-100 transition font-medium"
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </header>

      <h1 className="text-xl sm:text-2xl font-bold text-blue-600 text-center mb-4 mt-2">
        {webEvent || `${t('organizer')}: ${capitalizeFirstLetter(username)}`}
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
            <div>{t('playerData')}</div>
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
            <div>{t('matchScores')}</div>
          </div>
        </button>
      </div>

      <div className="flex-grow">
        {tab === 'players' && (
          isReadOnly ? 
            <ReadonlyPlayerPage username={username} /> : 
            <AdminPlayerPage username={username} />
        )}
        {tab === 'scores' && (
          isReadOnly ? 
            <ReadonlyScorePage username={username} defaultMode={userDefaultMode} /> : 
            <AdminScorePage username={username} defaultMode={userDefaultMode} />
        )}
      </div>

      <MarqueeAd />

      <footer className="text-center text-gray-500 text-sm mt-4 border-t pt-4">
        Copyright &copy; 2025-{new Date().getFullYear()}{' '}
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
