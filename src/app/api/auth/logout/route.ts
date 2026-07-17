import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.set('qrmenulerim_session', '', { path: '/', maxAge: 0 });
  return response;
}
