import { DatabaseService } from '@/lib/database'
import { createApiResponse, handleApiError } from '@/lib/api-utils'

export async function GET() {
  try {
    const data = await DatabaseService.getAllAccounts()
    return createApiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch accounts')
  }
}
