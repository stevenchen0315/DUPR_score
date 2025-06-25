'use client'

import { useState } from 'react'
import PlayerPage from '@/components/PlayerPage'
import ScorePage from '@/components/ScorePage'

export default function UserPage({ params }: { params: { username: string } }) {
  const [tab, setTab] = useState<'players' | 'scores'>('scores')

  return (
    <div>
      <button onClick={() => setTab('players')}>選手資料</button>
      <button onClick={() => setTab('scores')}>比賽分數</button>
      
      {tab === 'players' && <PlayerPage username={params.username} />}
      {tab === 'scores' && <ScorePage username={params.username} />}
    </div>
  )
}
