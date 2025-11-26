'use client'

import { useEffect, useState, useRef } from 'react'

const defaultAds = [
  {
    text: 'Gold Home澎湖民宿👉點我訂房',
    url: 'https://booking.owlting.com/goldhome?lang=zh_TW&adult=1&child=0&infant=0',
  },
  {
    image: '/purosopyh.png',
    url: 'https://purosophy.com/',
  },
]

export default function MarqueeAd() {
  const [ads, setAds] = useState(defaultAds)
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      const newAd = {
        image: imageUrl,
        url: '#',
      }
      setAds([...ads, newAd])
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ads.length)
        setFade(true)
      }, 500)
    }, 5000)

    return () => clearInterval(interval)
  }, [ads.length])

  return (
    <div className="text-center mt-6">
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          上傳廣告圖片
        </button>
      </div>
      
      <div className="h-[50px] md:h-[90px] overflow-hidden">
      <a
        href={ads[index].url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block transition-opacity duration-500 ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {ads[index].text ? (
          <span className="bg-yellow-100 text-yellow-800 font-semibold px-4 py-2 rounded-md shadow hover:bg-yellow-200">
            {ads[index].text}
          </span>
        ) : (
          <img
            src={ads[index].image}
            alt="廣告圖片"
            className="w-[320px] h-[50px] md:w-[728px] md:h-[90px] object-contain rounded-md shadow hover:opacity-80"
          />
        )}
      </a>
      </div>
    </div>
  )
}
