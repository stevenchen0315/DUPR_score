import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return Response.json({ error: 'Username and password required' }, { status: 400 })
    }
    
    const isValid = await DatabaseService.verifyPassword(username, password)
    
    return Response.json({ valid: isValid })
  } catch (error) {
    return Response.json({ error: 'Verification failed' }, { status: 500 })
  }
}
