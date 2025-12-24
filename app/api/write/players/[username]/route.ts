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
    const data = await DatabaseService.upsertPlayers(body, username)
    return createApiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Failed to save players')
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
    const data = await DatabaseService.updatePlayer(body, body.original_dupr_id, username)
    return createApiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Failed to update player')
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
    
    const duprId = searchParams.get('dupr_id')
    const deleteAll = searchParams.get('delete_all')
    
    if (deleteAll === 'true') {
      await DatabaseService.deleteAllPlayers(username)
    } else if (duprId) {
      await DatabaseService.deletePlayer(duprId, username)
    }

    return createApiResponse({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to delete player')
  }
}