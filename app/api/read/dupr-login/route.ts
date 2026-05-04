import { NextRequest } from 'next/server'
import { createApiResponse } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return createApiResponse({ error: 'Email and password required' }, 400)
    }

    const res = await fetch('https://api.dupr.gg/auth/v1.0/login', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json; charset=UTF-8',
        'origin': 'https://dashboard.dupr.com',
        'referer': 'https://dashboard.dupr.com/',
      },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok || data.status !== 'SUCCESS') {
      return createApiResponse({ error: data.message || 'Login failed' }, 401)
    }

    return createApiResponse({ accessToken: data.result?.accessToken })
  } catch (error) {
    console.error('DUPR login error:', error)
    return createApiResponse({ error: 'Login failed' }, 500)
  }
}
