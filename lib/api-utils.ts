import { NextResponse } from 'next/server'

// API 回應和錯誤處理
export const createApiResponse = (data: any, status = 200) => {
  return NextResponse.json(data, { status })
}

export const handleApiError = (error: any, message: string) => {
  console.error(message, error)
  return NextResponse.json({ error: message }, { status: 500 })
}

export const extractUsername = async (params: Promise<{ username: string }>) => {
  const { username } = await params
  return username
}
