'use client'

import { useState } from 'react'
import { usePlayerData } from '@/hooks/usePlayerData'
import PlayerList from '@/components/shared/PlayerList'
import { API_ENDPOINTS } from '@/lib/constants'
import { useLanguage } from '@/lib/i18n'

interface ReadonlyPlayerPageProps {
  username: string
}

export default function ReadonlyPlayerPage({ username }: ReadonlyPlayerPageProps) {
  const {
    userList,
    partnerNumbers,
    isLoading,
    lockedNames,
    loadingLockedNames,
    realtimeConnected
  } = usePlayerData(username)

  const { t } = useLanguage()
  const [duprRatings, setDuprRatings] = useState<{[duprId: string]: any}>({})
  const [isFetchingDupr, setIsFetchingDupr] = useState(false)
  const [showDuprLogin, setShowDuprLogin] = useState(false)
  const [duprEmail, setDuprEmail] = useState('')
  const [duprPassword, setDuprPassword] = useState('')
  const [duprLoginError, setDuprLoginError] = useState('')

  const handleDuprLogin = async () => {
    if (!duprEmail || !duprPassword) return
    setIsFetchingDupr(true)
    setDuprLoginError('')
    try {
      const loginRes = await fetch('/api/read/dupr-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: duprEmail, password: duprPassword })
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok || !loginData.accessToken) {
        setDuprLoginError(t('duprLoginFailed'))
        setIsFetchingDupr(false)
        return
      }

      const res = await fetch(API_ENDPOINTS.DUPR_RATINGS(username), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: loginData.accessToken })
      })
      if (res.ok) {
        const data = await res.json()
        const ratingsMap: {[duprId: string]: any} = {}
        data.ratings?.forEach((r: any) => {
          ratingsMap[r.duprId.toUpperCase()] = r
        })
        setDuprRatings(ratingsMap)
      }
      setShowDuprLogin(false)
      setDuprPassword('')
    } catch (error) {
      console.error('DUPR fetch error:', error)
      setDuprLoginError(t('duprLoginFailed'))
    } finally {
      setIsFetchingDupr(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        {userList.length} players
        <button
          onClick={() => setShowDuprLogin(true)}
          disabled={isFetchingDupr || userList.length === 0}
          className={`ml-2 px-3 py-1 rounded text-xs font-medium ${
            isFetchingDupr || userList.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isFetchingDupr ? t('fetchingDupr') : t('fetchDuprRatings')}
        </button>
      </div>

      <PlayerList
        userList={userList}
        partnerNumbers={partnerNumbers}
        lockedNames={lockedNames}
        loadingLockedNames={loadingLockedNames}
        selectedPlayers={new Set()}
        readonly={true}
        duprRatings={duprRatings}
      />

      {/* DUPR 登入彈窗 */}
      {showDuprLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => !isFetchingDupr && setShowDuprLogin(false)}>
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-center">{t('duprLogin')}</h3>
            <input
              type="email"
              placeholder={t('duprEmail')}
              value={duprEmail}
              onChange={e => setDuprEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isFetchingDupr}
            />
            <input
              type="password"
              placeholder={t('duprPassword')}
              value={duprPassword}
              onChange={e => setDuprPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDuprLogin()}
              className="w-full border rounded-md px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isFetchingDupr}
            />
            {duprLoginError && (
              <p className="text-red-500 text-sm mb-3 text-center">{duprLoginError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDuprLogin(false); setDuprLoginError('') }}
                disabled={isFetchingDupr}
                className="flex-1 px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('duprClose')}
              </button>
              <button
                onClick={handleDuprLogin}
                disabled={isFetchingDupr || !duprEmail || !duprPassword}
                className={`flex-1 px-4 py-2 rounded-md text-white ${
                  isFetchingDupr || !duprEmail || !duprPassword
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isFetchingDupr ? t('duprLoggingIn') : t('duprLoginBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
