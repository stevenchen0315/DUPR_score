'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'

export default function Home() {
  const [tabValue, setTabValue] = useState<'players' | 'scores'>('scores')

  return (
    <main className="p-4 max-w-full mx-auto min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-5 sm:p-8">
        <Tabs
          value={tabValue}
          onValueChange={(val) => setTabValue(val as 'players' | 'scores')}
          className="w-full"
        >
          <TabsList className="mb-6 flex flex-wrap gap-2 justify-center sm:justify-start border-b border-gray-300 pb-2">
            <TabsTrigger
              value="players"
              className="flex-1 sm:flex-none text-base sm:text-lg font-semibold px-4 py-2 rounded-md hover:bg-blue-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition"
            >
              選手資料
            </TabsTrigger>
            <TabsTrigger
              value="scores"
              className="flex-1 sm:flex-none text-base sm:text-lg font-semibold px-4 py-2 rounded-md hover:bg-blue-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition"
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
