// app/api/scores/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase.from('score').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { player_a1, player_a2, player_b1, player_b2, team_a_score, team_b_score, lock } = body;

  if (!player_a1 || !player_b1 || team_a_score === undefined || team_b_score === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await supabase.from('score').insert([{
    player_a1,
    player_a2: player_a2 || null,
    player_b1,
    player_b2: player_b2 || null,
    team_a_score,
    team_b_score,
    lock: lock || false,
  }]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: 'Score added' });
}
