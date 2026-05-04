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

  const fetchDuprRatings = async () => {
    setIsFetchingDupr(true)
    try {
      const res = await fetch(API_ENDPOINTS.DUPR_RATINGS(username))
      if (res.ok) {
        const data = await res.json()
        const ratingsMap: {[duprId: string]: any} = {}
        data.ratings?.forEach((r: any) => {
          ratingsMap[r.duprId.toUpperCase()] = r
        })
        setDuprRatings(ratingsMap)
      }
    } catch (error) {
      console.error('Fetch DUPR ratings error:', error)
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
          onClick={fetchDuprRatings}
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
    </div>
  )
}
