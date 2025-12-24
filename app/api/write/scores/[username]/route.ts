import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const body = await request.json()

    const { data, error } = await supabaseServer
      .from('score')
      .insert({
        serial_number: body.serial_number,
        player_a1: body.player_a1 || '',
        player_a2: body.player_a2 || '',
        player_b1: body.player_b1 || '',
        player_b2: body.player_b2 || '',
        team_a_score: body.team_a_score,
        team_b_score: body.team_b_score,
        lock: body.lock || false,
        check: body.check || false,
        updated_time: body.updated_time
      })
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0] || {})
  } catch (error) {
    console.error('Create score error:', error)
    return NextResponse.json({ error: 'Failed to create score' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const body = await request.json()

    const { data, error } = await supabaseServer
      .from('score')
      .upsert({
        serial_number: body.serial_number,
        player_a1: body.player_a1 || '',
        player_a2: body.player_a2 || '',
        player_b1: body.player_b1 || '',
        player_b2: body.player_b2 || '',
        team_a_score: body.team_a_score,
        team_b_score: body.team_b_score,
        lock: body.lock || false,
        check: body.check || false,
        updated_time: body.updated_time
      })
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0] || {})
  } catch (error) {
    console.error('Update score error:', error)
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const { searchParams } = new URL(request.url)
    const serialNumber = searchParams.get('serial_number')
    const deleteAll = searchParams.get('delete_all')

    if (deleteAll === 'true') {
      const { error } = await supabaseServer
        .from('score')
        .delete()
        .like('serial_number', `%_${username}`)

      if (error) throw error
    } else if (serialNumber) {
      const { error } = await supabaseServer
        .from('score')
        .delete()
        .eq('serial_number', serialNumber)

      if (error) throw error
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete score error:', error)
    return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 })
  }
}
