'use client'

import { useEffect, useState } from 'react'

const ads = [
  {
    text: 'Gold Home澎湖民宿👉點我訂房',
    url: 'https://booking.owlting.com/goldhome?lang=zh_TW&adult=1&child=0&infant=0',
  },
  {
    text: '樹林輕鬆匹克球週六日零打👉點我入群',
    url: 'https://line.me/ti/g/DU-T74Hccm',
  },
]

export default function MarqueeAd() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ads.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center mt-6 h-12 overflow-hidden">
      <a
        href={ads[index].url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-yellow-100 text-yellow-800 font-semibold px-4 py-2 rounded-md shadow hover:bg-yellow-200 transition-all duration-500 animate-slide"
      >
        {ads[index].text}
      </a>
    </div>
  )
}
