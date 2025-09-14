import { NextResponse } from 'next/server';

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
