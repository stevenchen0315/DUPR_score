import { useState, useCallback, useEffect } from 'react'
import { player_info } from '@/types'
import { API_ENDPOINTS } from '@/lib/constants'

export const useUserData = (username: string) => {
  const [userList, setUserList] = useState<player_info[]>([])
  const [partnerNumbers, setPartnerNumbers] = useState<{[key: string]: number | null}>({})
  const [storedPassword, setStoredPassword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!username) {
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const [accountResponse, playersResponse] = await Promise.all([
        fetch(API_ENDPOINTS.ACCOUNT(username)),
        fetch(API_ENDPOINTS.PLAYERS(username))
      ])

      if (accountResponse.ok) {
        const account = await accountResponse.json()
        if (account?.password) setStoredPassword(account.password)
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
  }, [username])

  const refetchPlayers = useCallback(async () => {
    if (!username) return
    const response = await fetch(API_ENDPOINTS.PLAYERS(username))
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
  }, [username])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    userList,
    partnerNumbers,
    storedPassword,
    isLoading,
    setUserList,
    setPartnerNumbers,
    fetchData,
    refetchPlayers
  }
}