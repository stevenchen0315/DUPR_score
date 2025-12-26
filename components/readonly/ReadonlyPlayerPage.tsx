'use client'

import { usePlayerData } from '@/hooks/usePlayerData'
import PlayerList from '@/components/shared/PlayerList'

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
      </div>

      <PlayerList
        userList={userList}
        partnerNumbers={partnerNumbers}
        lockedNames={lockedNames}
        loadingLockedNames={loadingLockedNames}
        selectedPlayers={new Set()}
        readonly={true}
      />
    </div>
  )
}