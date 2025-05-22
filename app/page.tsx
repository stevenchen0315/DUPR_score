// app/page.tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'

export default function Home() {
  return (
    <main className="p-6 max-w-5xl mx-auto">
      <Tabs defaultValue="players" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="players">選手資料</TabsTrigger>
          <TabsTrigger value="scores">比賽分數</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <PlayerPage />
        </TabsContent>

        <TabsContent value="scores">
          <ScorePage />
        </TabsContent>
      </Tabs>
    </main>
  )
}