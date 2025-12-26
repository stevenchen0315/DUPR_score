'use client'

import { useState, useEffect } from 'react'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { useCommonData } from './useCommonData'
import { API_ENDPOINTS } from '@/lib/constants'

export const usePlayerData = (username: string) => {
  const {
    userList,
    partnerNumbers,
    storedPassword,
    isLoading,
    setUserList,
    setPartnerNumbers,
    refetchPlayers
  } = useCommonData(username)
  
  const [lockedNames, setLockedNames] = useState<Set<string>>(new Set())
  const [loadingLockedNames, setLoadingLockedNames] = useState(true)
  const [hasActiveScores, setHasActiveScores] = useState(false)

  const checkActiveScores = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SCORES(username))
      if (response.ok) {
        const scores = await response.json()
        setHasActiveScores(Boolean(scores && scores.length > 0))
        
        if (scores) {
          const namesInScores = new Set<string>()
          scores.forEach((score: any) => {
            const fields = ['player_a1', 'player_a2', 'player_b1', 'player_b2']
            fields.forEach(field => {
              const name = score[field]
              if (name) namesInScores.add(name)
            })
          })
          setLockedNames(namesInScores)
        }
      }
      setLoadingLockedNames(false)
    } catch (error) {
      console.error('Check scores error:', error)
      setHasActiveScores(false)
      setLoadingLockedNames(false)
    }
  }

  const { connected: playerConnected } = useRealtimeSubscription(
    username,
    'player_info',
    async (payload: any) => {
      const duprId = payload.new?.dupr_id || payload.old?.dupr_id
      if (duprId && typeof duprId === 'string' && duprId.includes(`_${username}`)) {
        await refetchPlayers()
      }
    }
  )
  
  const { connected: scoreConnected } = useRealtimeSubscription(
    username,
    'score',
    async (payload: any) => {
      const serialNumber = payload.new?.serial_number || payload.old?.serial_number
      if (serialNumber && typeof serialNumber === 'string' && serialNumber.includes(`_${username}`)) {
        await checkActiveScores()
      }
    }
  )

  useEffect(() => {
    if (username) {
      checkActiveScores()
    }
  }, [username])

  return {
    userList,
    partnerNumbers,
    storedPassword,
    isLoading,
    lockedNames,
    loadingLockedNames,
    hasActiveScores,
    realtimeConnected: playerConnected && scoreConnected,
    setUserList,
    setPartnerNumbers,
    refetchPlayers
  }
}