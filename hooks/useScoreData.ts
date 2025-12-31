'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useCommonData } from './useCommonData'

type Row = {
  serial_number: number
  values: string[]
  sd: string
  h: string
  i: string
  lock: string
  check: boolean
  court?: number | null
  updated_time?: string
}

export const useScoreData = (username: string) => {
  const {
    userList,
    partnerNumbers,
    storedPassword,
    eventName,
    isLoading,
    setEventName
  } = useCommonData(username)
  
  const [rows, setRows] = useState<Row[]>([])
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  
  const lastLocalUpdateRef = useRef<number>(0)
  const scoreChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const playerChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const formatScores = (scores: any[]): Row[] => {
    return scores.map((item: any) => {
      const serialNum = parseInt(item.serial_number.toString().replace(`_${username}`, ''))
      return {
        serial_number: serialNum,
        values: [item.player_a1, item.player_a2, item.player_b1, item.player_b2],
        h: item.team_a_score?.toString() ?? '',
        i: item.team_b_score?.toString() ?? '',
        lock: item.lock ? 'Locked' : 'Unlocked',
        check: Boolean(item.check),
        court: item.court,
        updated_time: item.updated_time,
        sd:
          [item.player_a1, item.player_a2].filter(Boolean).length === 1 &&
          [item.player_b1, item.player_b2].filter(Boolean).length === 1
            ? 'S'
            : [item.player_a1, item.player_a2].filter(Boolean).length === 2 &&
              [item.player_b1, item.player_b2].filter(Boolean).length === 2
            ? 'D'
            : ''
      }
    })
  }

  const refetchScores = async () => {
    if (!username) return
    const response = await fetch(`/api/read/scores/${username}`)
    if (response.ok) {
      const data = await response.json()
      if (data) {
        const sorted = data.sort((a: any, b: any) => parseInt(a.serial_number) - parseInt(b.serial_number))
        setRows(formatScores(sorted))
      }
    }
  }

  const refetchPlayers = async () => {
    if (!username) return
    const response = await fetch(`/api/read/players/${username}`)
    if (response.ok) {
      const users = await response.json()
      if (users) {
        const partners: {[key: string]: number | null} = {}
        users.map((u: any) => {
          partners[u.name] = u.partner_number
        })
      }
    }
  }

  const resubscribe = () => {
    if (!username) return
    
    if (scoreChannelRef.current) supabase.removeChannel(scoreChannelRef.current)
    if (playerChannelRef.current) supabase.removeChannel(playerChannelRef.current)
    setRealtimeConnected(false)

    const scoreChannel = supabase
      .channel(`score-${username}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'score' }, async (payload: any) => {
        const now = Date.now()
        if (now - lastLocalUpdateRef.current < 3000) return
        
        const serialNumber = payload.new?.serial_number || payload.old?.serial_number
        if (serialNumber && typeof serialNumber === 'string' && serialNumber.includes(`_${username}`)) {
          setTimeout(async () => { await refetchScores() }, 100)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setTimeout(() => setRealtimeConnected(true), 1000)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setTimeout(() => resubscribe(), 3000)
        }
      })

    const playerChannel = supabase
      .channel(`player-${username}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_info' }, async (payload: any) => {
        const duprId = payload.new?.dupr_id || payload.old?.dupr_id
        if (duprId && typeof duprId === 'string' && duprId.includes(`_${username}`)) {
          await refetchPlayers()
        }
      })
      .subscribe()

    scoreChannelRef.current = scoreChannel
    playerChannelRef.current = playerChannel
  }

  useEffect(() => {
    if (!username) return

    const fetchScores = async () => {
      try {
        const scoresResponse = await fetch(`/api/read/scores/${username}`)
        if (scoresResponse.ok) {
          const scores = await scoresResponse.json()
          if (scores) {
            const sorted = scores.sort((a: any, b: any) => parseInt(a.serial_number) - parseInt(b.serial_number))
            setRows(formatScores(sorted))
          }
        }
      } catch (error) {
        console.error('Fetch error:', error)
      }
    }

    fetchScores().then(() => resubscribe())

    return () => {
      if (scoreChannelRef.current) supabase.removeChannel(scoreChannelRef.current)
      if (playerChannelRef.current) supabase.removeChannel(playerChannelRef.current)
    }
  }, [username])

  useEffect(() => {
    if (!username) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refetchScores()
        refetchPlayers()
        if (!scoreChannelRef.current || !playerChannelRef.current) resubscribe()
      }
    }
    const onFocus = () => { refetchScores(); refetchPlayers() }
    const onOnline = () => { refetchScores(); refetchPlayers(); resubscribe() }
    const onPageShow = () => { refetchScores(); refetchPlayers(); resubscribe() }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [username])

  return {
    userList,
    rows,
    storedPassword,
    eventName,
    isLoading,
    realtimeConnected,
    partnerNumbers,
    lastLocalUpdateRef,
    setRows,
    setEventName,
    refetchScores,
    refetchPlayers,
    formatScores
  }
}
