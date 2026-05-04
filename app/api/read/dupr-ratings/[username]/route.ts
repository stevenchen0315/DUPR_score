import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { createApiResponse, handleApiError, extractUsername } from '@/lib/api-utils'

async function fetchDuprRating(duprId: string, token: string) {
  try {
    const res = await fetch('https://api.dupr.gg/player/v1.0/search', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json; charset=UTF-8',
        'origin': 'https://dashboard.dupr.com',
        'referer': 'https://dashboard.dupr.com/',
      },
      body: JSON.stringify({
        limit: 1,
        offset: 0,
        query: duprId,
        exclude: [],
        includeUnclaimedPlayers: true,
        filter: {
          lat: 25.0599924,
          lng: 121.4806088,
          rating: { maxRating: null, minRating: null },
          locationText: ''
        }
      })
    })

    if (!res.ok) return null

    const data = await res.json()
    const hit = data.result?.hits?.find(
      (h: any) => h.duprId?.toUpperCase() === duprId.toUpperCase()
    )
    if (!hit) return null

    return {
      duprId: hit.duprId,
      fullName: hit.fullName,
      doubles: hit.ratings?.doubles ?? 'NR',
      doublesRS: hit.ratings?.doublesReliabilityScore ?? 0,
      singles: hit.ratings?.singles ?? 'NR',
      singlesRS: hit.ratings?.singlesReliabilityScore ?? 0,
    }
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { token } = await request.json()
    if (!token) {
      return createApiResponse({ error: 'DUPR token required' }, 401)
    }

    const username = await extractUsername(params)
    const players = await DatabaseService.getPlayersByUsername(username)

    if (!players || players.length === 0) {
      return createApiResponse({ ratings: [] })
    }

    const duprIds = players.map(p => p.dupr_id.replace(`_${username}`, ''))

    const ratings: any[] = []
    for (const duprId of duprIds) {
      const rating = await fetchDuprRating(duprId, token)
      const player = players.find(p => p.dupr_id.replace(`_${username}`, '') === duprId)
      ratings.push({
        duprId,
        name: player?.name ?? '',
        doubles: rating?.doubles ?? 'NR',
        doublesRS: rating?.doublesRS ?? 0,
        singles: rating?.singles ?? 'NR',
        singlesRS: rating?.singlesRS ?? 0,
        fullName: rating?.fullName ?? '',
      })
      await new Promise(r => setTimeout(r, 200))
    }

    return createApiResponse({ ratings })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch DUPR ratings')
  }
}
