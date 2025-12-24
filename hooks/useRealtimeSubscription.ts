import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useRealtimeSubscription = (
  username: string,
  tableName: string,
  callback: (payload: any) => void
) => {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!username || !tableName) {
      setConnected(false)
      return
    }

    let channel: RealtimeChannel

    const setupSubscription = () => {
      channel = supabase
        .channel(`${tableName}_${username}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName
          },
          callback
        )
        .subscribe((status) => {
          setConnected(status === 'SUBSCRIBED')
        })
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      setConnected(false)
    }
  }, [username, tableName, callback])

  return { connected }
}