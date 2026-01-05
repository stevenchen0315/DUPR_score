import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { createApiResponse, handleApiError, extractUsername } from '@/lib/api-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const username = await extractUsername(params)
    const { password } = await request.json()
    
    if (!password) {
      return Response.json({ error: 'Password required' }, { status: 400 })
    }
    
    const isValid = await DatabaseService.verifyPassword(username, password)
    
    if (!isValid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    const data = await DatabaseService.getAccount(username)
    return createApiResponse({
      username,
      event: data.event,
      default_mode: data.default_mode
    })
  } catch (error) {
    return handleApiError(error, 'Authentication failed')
  }
}
