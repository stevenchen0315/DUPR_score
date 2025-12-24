import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const body = await request.json()
  
  if (Array.isArray(body)) {
    const playersData = body.map(player => ({
      dupr_id: `${player.dupr_id}_${username}`,
      name: player.name,
      partner_number: player.partner_number
    }))
    
    const { data, error } = await supabaseServer
      .from('player_info')
      .upsert(playersData, { onConflict: 'dupr_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }
  
  const { data, error } = await supabaseServer
    .from('player_info')
    .upsert({
      dupr_id: `${body.dupr_id}_${username}`,
      name: body.name,
      partner_number: body.partner_number
    }, { onConflict: 'dupr_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const body = await request.json()
  
  const { data, error } = await supabaseServer
    .from('player_info')
    .update({
      dupr_id: `${body.dupr_id}_${username}`,
      name: body.name,
      partner_number: body.partner_number
    })
    .eq('dupr_id', `${body.original_dupr_id}_${username}`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const { searchParams } = new URL(request.url)
  const duprId = searchParams.get('dupr_id')
  const deleteAll = searchParams.get('delete_all')
  
  if (deleteAll === 'true') {
    const { error } = await supabaseServer
      .from('player_info')
      .delete()
      .like('dupr_id', `%_${username}`)
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else if (duprId) {
    const { error } = await supabaseServer
      .from('player_info')
      .delete()
      .eq('dupr_id', `${duprId}_${username}`)
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
