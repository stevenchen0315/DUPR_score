import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('account')
      .select('username, web_event, default_mode')

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get accounts error:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}
