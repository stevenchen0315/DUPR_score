import { get, set } from '@vercel/edge-config';
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await get('users');
  return NextResponse.json(Array.isArray(users) ? users : []);
}

export async function POST(req: Request) {
  const body = await req.json();
  await set('users', body);
  return NextResponse.json({ success: true });
}
