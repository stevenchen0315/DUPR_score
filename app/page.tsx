'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlayerInfo, Score } from '@/types'

export default function Home() {
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [scores, setScores] = useState<Score[]>([])

  const [newPlayer, setNewPlayer] = useState({ dupr_id: '', name: '' })

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('player_info').select('*')
    if (data) setPlayers(data)
  }

  const fetchScores = async () => {
    const { data } = await supabase.from('score').select('*')
    if (data) setScores(data)
  }

  const addPlayer = async () => {
    await supabase.from('player_info').insert([newPlayer])
    setNewPlayer({ dupr_id: '', name: '' })
    fetchPlayers()
  }

  const addScore = async () => {
    const dummy: Score = {
      player_a1: players[0]?.dupr_id || '',
      player_a2: players[1]?.dupr_id || '',
      player_b1: players[2]?.dupr_id || '',
      player_b2: players[3]?.dupr_id || '',
      team_a_score: 11,
      team_b_score: 8,
      lock: false,
    }
    await supabase.from('score').insert([dummy])
    fetchScores()
  }

  useEffect(() => {
    fetchPlayers()
    fetchScores()
  }, [])

  return (
    <main className="p-6 max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">🎾 DUPR 系統</h1>

      <section>
        <h2 className="text-xl font-semibold">新增選手</h2>
        <input
          className="border p-2 mr-2"
          placeholder="DUPR ID"
          value={newPlayer.dupr_id}
          onChange={(e) => setNewPlayer({ ...newPlayer, dupr_id: e.target.value })}
        />
        <input
          className="border p-2 mr-2"
          placeholder="暱稱"
          value={newPlayer.name}
          onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={addPlayer}>
          儲存
        </button>
      </section>

      <section>
        <h2 className="text-xl font-semibold">選手名單</h2>
        <ul className="list-disc ml-6">
          {players.map((p) => (
            <li key={p.dupr_id}>{p.name} ({p.dupr_id})</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">比賽記錄</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={addScore}>
          模擬新增一場比賽
        </button>
        <ul className="mt-4 space-y-2">
          {scores.map((s, i) => (
            <li key={i} className="border p-2 rounded">
              A隊: {s.player_a1}, {s.player_a2} ({s.team_a_score}) vs B隊: {s.player_b1}, {s.player_b2} ({s.team_b_score}) - {s.lock ? '🔒 已鎖定' : '🔓 未鎖定'}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
