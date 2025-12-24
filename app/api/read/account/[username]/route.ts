import { NextRequest } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { createApiResponse, handleApiError, extractUsername } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const username = await extractUsername(params)
    const data = await DatabaseService.getAccount(username)
    return createApiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch account')
  }
}
