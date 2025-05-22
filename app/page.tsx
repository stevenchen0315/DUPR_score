'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'
import { motion } from 'framer-motion'

export default function Home() {
  const [tabValue, setTabValue] = useState<'players' | 'scores'>('scores')

  return (
    <main className="p-4 min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 font-sans">
  <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 p-5 sm:p-8 transition-all duration-300">
    <Tabs value={tabValue} onValueChange={(val) => setTabValue(val as 'players' | 'scores')} className="w-full">
      <TabsList className="mb-6 flex overflow-x-auto gap-2 justify-start border-b border-blue-300 pb-2 scrollbar-hide">
        <TabsTrigger
          value="players"
          className="flex-1 sm:flex-none text-base sm:text-lg font-semibold px-4 py-2 rounded-md transition-all duration-200
            hover:bg-blue-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-900"
        >
          選手資料
        </TabsTrigger>
        <TabsTrigger
          value="scores"
          className="flex-1 sm:flex-none text-base sm:text-lg font-semibold px-4 py-2 rounded-md transition-all duration-200
            hover:bg-blue-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-900"
        >
          比賽分數
        </TabsTrigger>
      </TabsList>

      <TabsContent
            value="players"
            className="text-gray-800 text-base sm:text-lg leading-relaxed"
          >
            <PlayerPage />
          </TabsContent>

          <TabsContent
            value="scores"
            className="text-gray-800 text-base sm:text-lg leading-relaxed"
          >
            <ScorePage />
          </TabsContent>
    </Tabs>
  </div>
</main>

  )
}
