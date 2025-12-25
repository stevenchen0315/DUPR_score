import { useState, useEffect } from 'react'
import { player_info } from '@/types'

export const useCommonData = (username: string) => {
  const [userList, setUserList] = useState<player_info[]>([])
  const [partnerNumbers, setPartnerNumbers] = useState<{[key: string]: number | null}>({})
  const [storedPassword, setStoredPassword] = useState<string | null>(null)
  const [eventName, setEventName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchCommonData = async () => {
    if (!username) return

    try {
      const [accountResponse, playersResponse] = await Promise.all([
        fetch(`/api/read/account/${username}`),
        fetch(`/api/read/players/${username}`)
      ])

      if (accountResponse.ok) {
        const account = await accountResponse.json()
        if (account?.password) setStoredPassword(account.password)
        if (account?.event) setEventName(account.event)
      }

      if (playersResponse.ok) {
        const users = await playersResponse.json()
        if (users) {
          const partners: {[key: string]: number | null} = {}
          const userListData = users.map((u: any) => {
            const cleanId = u.dupr_id.replace(`_${username}`, '')
            partners[u.name] = u.partner_number
            return { dupr_id: cleanId, name: u.name }
          })
          setUserList(userListData)
          setPartnerNumbers(partners)
        }
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Fetch error:', error)
      setIsLoading(false)
    }
  }

  const refetchPlayers = async () => {
    if (!username) return
    const response = await fetch(`/api/read/players/${username}`)
    if (response.ok) {
      const users = await response.json()
      if (users) {
        const partners: {[key: string]: number | null} = {}
        const userListData = users.map((u: any) => {
          const cleanId = u.dupr_id.replace(`_${username}`, '')
          partners[u.name] = u.partner_number
          return { dupr_id: cleanId, name: u.name }
        })
        setUserList(userListData)
        setPartnerNumbers(partners)
      }
    }
  }

  useEffect(() => {
    fetchCommonData()
  }, [username])

  useEffect(() => {
    if (!username) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refetchPlayers()
      }
    }
    const onFocus = () => { refetchPlayers() }
    const onOnline = () => { refetchPlayers() }
    const onPageShow = () => { refetchPlayers() }

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
    partnerNumbers,
    storedPassword,
    eventName,
    isLoading,
    setUserList,
    setPartnerNumbers,
    setEventName,
    refetchPlayers
  }
}