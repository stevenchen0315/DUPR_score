import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { createApiResponse, handleApiError, extractUsername } from '@/lib/api-utils'

async function fetchDuprRating(duprId: string, token: string, filter?: any) {
  const debug: any = { duprId }
  try {
    const searchFilter: any = {
      lat: null,
      lng: null,
      rating: { maxRating: null, minRating: null },
      locationText: ''
    }

    if (filter) {
      if (filter.gender && filter.gender !== 'ALL') {
        searchFilter.gender = filter.gender
      }
      if (filter.ratingRange) {
        const isFullRange = filter.ratingRange[0] <= 2 && filter.ratingRange[1] >= 8
        searchFilter.rating = {
          minRating: isFullRange ? null : filter.ratingRange[0],
          maxRating: isFullRange ? null : filter.ratingRange[1],
          ...(filter.type === 'DOUBLES' && { type: 'DOUBLES' }),
          ...(filter.type === 'SINGLES' && { type: 'SINGLES' }),
        }
      }
      if (filter.ageRange) {
        searchFilter.ageRange = {
          minAge: filter.ageRange[0] <= 19 ? 0 : filter.ageRange[0],
          maxAge: filter.ageRange[1] >= 80 ? 105 : filter.ageRange[1],
        }
      }
    }

    const requestBody = {
      limit: 1,
      offset: 0,
      query: duprId,
      exclude: [],
      includeUnclaimedPlayers: true,
      filter: searchFilter
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DUPR] request for ${duprId}:`, JSON.stringify(requestBody, null, 2))
    }

    const res = await fetch('https://api.dupr.gg/player/v1.0/search', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json; charset=UTF-8',
        'origin': 'https://dashboard.dupr.com',
        'referer': 'https://dashboard.dupr.com/',
      },
      body: JSON.stringify(requestBody)
    })

    debug.httpStatus = res.status

    if (!res.ok) {
      debug.error = await res.text()
      return { rating: null, debug }
    }

    const data = await res.json()

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DUPR] response for ${duprId}:`, JSON.stringify(data, null, 2))
    }

    debug.totalHits = data.result?.hits?.length ?? 0

    if (data.result?.hits?.length > 0) {
      debug.firstHit = data.result.hits[0]
    }

    const hit = data.result?.hits?.find(
      (h: any) => h.duprId?.toUpperCase() === duprId.toUpperCase()
    )

    if (!hit) {
      debug.matchResult = 'NOT_FOUND'
      return { rating: null, debug }
    }

    debug.matchResult = 'found'
    return {
      rating: {
        duprId: hit.duprId,
        fullName: hit.fullName,
        gender: hit.gender ?? null,
        doubles: hit.ratings?.doubles ?? 'NR',
        doublesRS: hit.ratings?.doublesReliabilityScore ?? 0,
        singles: hit.ratings?.singles ?? 'NR',
        singlesRS: hit.ratings?.singlesReliabilityScore ?? 0,
      },
      debug
    }
  } catch (err: any) {
    debug.exception = err.message
    return { rating: null, debug }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { token, filter } = await request.json()
    if (!token) {
      return createApiResponse({ error: 'DUPR token required' }, 401)
    }

    const username = await extractUsername(params)
    const players = await DatabaseService.getPlayersByUsername(username)

    const debugInfo: any = {
      username,
      playersCount: players?.length ?? 0,
      rawDuprIds: players?.map(p => p.dupr_id) ?? [],
    }

    if (!players || players.length === 0) {
      return createApiResponse({ ratings: [], debug: debugInfo })
    }

    const duprIds = players.map(p => p.dupr_id.replace(`_${username}`, ''))
    debugInfo.cleanDuprIds = duprIds

    const ratings: any[] = []
    const searchDebug: any[] = []

    for (const duprId of duprIds) {
      const { rating, debug } = await fetchDuprRating(duprId, token, filter)
      searchDebug.push(debug)
      const player = players.find(p => p.dupr_id.replace(`_${username}`, '') === duprId)

      if (rating) {
        ratings.push({
          duprId,
          name: player?.name ?? '',
          doubles: rating.doubles,
          doublesRS: rating.doublesRS,
          singles: rating.singles,
          singlesRS: rating.singlesRS,
          fullName: rating.fullName,
          gender: rating.gender,
          status: 'FOUND',
        })
      } else {
        ratings.push({
          duprId,
          name: player?.name ?? '',
          doubles: 'NOT_FOUND',
          doublesRS: 0,
          singles: 'NOT_FOUND',
          singlesRS: 0,
          fullName: '',
          status: 'NOT_FOUND',
        })
      }
      await new Promise(r => setTimeout(r, 200))
    }

    debugInfo.searchResults = searchDebug
    return createApiResponse({ ratings, debug: debugInfo })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch DUPR ratings')
  }
}
