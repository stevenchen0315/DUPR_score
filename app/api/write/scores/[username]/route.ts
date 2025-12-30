import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { createApiResponse, handleApiError, extractUsername } from '@/lib/api-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const username = await extractUsername(params)
    
    // 檢查用戶權限 - 允許?mode=admin覆蓋
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode')
    
    if (mode !== 'admin') {
      const account = await DatabaseService.getAccount(username)
      if (account?.default_mode === 'readonly') {
        return createApiResponse({ error: 'Forbidden' }, 403)
      }
    }
    
    const body = await request.json()
    const scoreData = {
      serial_number: body.serial_number,
      player_a1: body.player_a1 || '',
      player_a2: body.player_a2 || '',
      player_b1: body.player_b1 || '',
      player_b2: body.player_b2 || '',
      team_a_score: body.team_a_score,
      team_b_score: body.team_b_score,
      lock: body.lock || false,
      check: body.check || false,
      court: body.court || null,
      updated_time: body.updated_time
    }
    const data = await DatabaseService.insertScore(scoreData)
    return createApiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Failed to create score')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const username = await extractUsername(params)
    
    // 檢查用戶權限 - 允許?mode=admin覆蓋
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode')
    
    if (mode !== 'admin') {
      const account = await DatabaseService.getAccount(username)
      if (account?.default_mode === 'readonly') {
        return createApiResponse({ error: 'Forbidden' }, 403)
      }
    }
    
    const body = await request.json()
    const scoreData = {
      serial_number: body.serial_number,
      player_a1: body.player_a1 || '',
      player_a2: body.player_a2 || '',
      player_b1: body.player_b1 || '',
      player_b2: body.player_b2 || '',
      team_a_score: body.team_a_score,
      team_b_score: body.team_b_score,
      lock: body.lock || false,
      check: body.check || false,
      court: body.court || null,
      updated_time: body.updated_time
    }
    const data = await DatabaseService.upsertScore(scoreData)
    return createApiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Failed to update score')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const username = await extractUsername(params)
    
    // 檢查用戶權限 - 允許?mode=admin覆蓋
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode')
    
    if (mode !== 'admin') {
      const account = await DatabaseService.getAccount(username)
      if (account?.default_mode === 'readonly') {
        return createApiResponse({ error: 'Forbidden' }, 403)
      }
    }
    
    const serialNumber = searchParams.get('serial_number')
    const deleteAll = searchParams.get('delete_all')

    if (deleteAll === 'true') {
      await DatabaseService.deleteAllScores(username)
    } else if (serialNumber) {
      await DatabaseService.deleteScore(serialNumber)
    } else {
      return createApiResponse({ error: 'Missing parameters' }, 400)
    }

    return createApiResponse({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to delete score')
  }
}
