'use client';

import React, { useEffect, useState } from 'react';

type Player = {
  dupr_id: string;
  name: string;
};

type Score = {
  id: number;
  player_a1: string;
  player_a2: string | null;
  player_b1: string;
  player_b2: string | null;
  team_a_score: number;
  team_b_score: number;
  lock: boolean;
};

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  // 載入選手
  const loadPlayers = async () => {
    const res = await fetch('/api/players');
    const data = await res.json();
    setPlayers(data);
  };

  // 載入比賽紀錄
  const loadScores = async () => {
    const res = await fetch('/api/scores');
    const data = await res.json();
    setScores(data);
  };

  useEffect(() => {
    loadPlayers();
    loadScores();
  }, []);

  // 新增選手範例（實際可改成表單輸入）
  const addPlayer = async () => {
    const dupr_id = prompt('輸入dupr_id') || '';
    const name = prompt('輸入選手名稱') || '';
    if (!dupr_id || !name) return alert('請輸入完整資訊');

    await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dupr_id, name }),
    });

    loadPlayers();
  };

  // 新增比賽範例（實際可改成表單）
  const addScore = async () => {
    const player_a1 = prompt('隊伍A 玩家1 dupr_id') || '';
    const player_a2 = prompt('隊伍A 玩家2 dupr_id (可空)') || null;
    const player_b1 = prompt('隊伍B 玩家1 dupr_id') || '';
    const player_b2 = prompt('隊伍B 玩家2 dupr_id (可空)') || null;
    const team_a_score = Number(prompt('隊伍A分數'));
    const team_b_score = Number(prompt('隊伍B分數'));
    const lock = confirm('是否鎖定此比賽紀錄？');

    if (!player_a1 || !player_b1 || isNaN(team_a_score) || isNaN(team_b_score)) {
      return alert('輸入資訊不完整或分數錯誤');
    }

    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_a1,
        player_a2,
        player_b1,
        player_b2,
        team_a_score,
        team_b_score,
        lock,
      }),
    });

    loadScores();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>選手列表</h1>
      <button onClick={addPlayer}>新增選手</button>
      <ul>
        {players.map((p) => (
          <li key={p.dupr_id}>
            {p.dupr_id} - {p.name}
          </li>
        ))}
      </ul>

      <h1>比賽紀錄</h1>
      <button onClick={addScore}>新增比賽</button>
      <ul>
        {scores.map((s) => (
          <li key={s.id}>
            A: {s.player_a1} {s.player_a2 || ''} ({s.team_a_score}) vs B: {s.player_b1}{' '}
            {s.player_b2 || ''} ({s.team_b_score}) {s.lock ? '🔒' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
