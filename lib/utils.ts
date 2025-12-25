import { useRef, useState, useEffect } from 'react'

export function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay = 200) {
  const timer = useRef<number | null>(null)
  return (...args: Parameters<T>) => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => fn(...args), delay)
  }
}

export const usePlayerFilter = (username: string, userList: any[]) => {
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>('')
  const FILTER_STORAGE_KEY = `playerFilter_${username}`

  useEffect(() => {
    if (username && userList.length > 0) {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved && userList.some(user => user.name === saved)) {
        setSelectedPlayerFilter(saved)
      }
    }
  }, [username, userList])

  return { selectedPlayerFilter, setSelectedPlayerFilter, FILTER_STORAGE_KEY }
}

export const useScrollToTop = () => {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return showScrollTop
}