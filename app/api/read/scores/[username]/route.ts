import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const { data, error } = await supabaseServer
      .from('score')
      .select('serial_number, player_a1, player_a2, player_b1, player_b2, team_a_score, team_b_score, lock, check, updated_time')
      .like('serial_number', `%_${username}`)
      .order('serial_number')

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get scores error:', error)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}
