import { get } from '@vercel/edge-config';
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await get('users');
  return NextResponse.json(users ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          operation: 'update',
          key: 'users',
          value: body,
        },
      ],
    }),
  });

  const result = await res.json();
  return NextResponse.json(result);
}
