'use client'

import { useEffect, useState } from 'react'

const ads = [
  {
    text: 'Gold Home澎湖民宿👉點我訂房',
    url: 'https://booking.owlting.com/goldhome?lang=zh_TW&adult=1&child=0&infant=0',
  },  
]

export default function MarqueeAd() {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false) // 先淡出
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ads.length)
        setFade(true) // 再淡入
      }, 500) // 要跟 CSS transition-duration 一致
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center mt-6 h-12 overflow-hidden">
      <a
        href={ads[index].url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block bg-yellow-100 text-yellow-800 font-semibold px-4 py-2 rounded-md shadow hover:bg-yellow-200 transition-opacity duration-500 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {ads[index].text}
      </a>
    </div>
  )
}
