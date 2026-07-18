import { NextResponse } from 'next/server';
import { reapExpiredTrials } from '@/lib/lifecycle';

export async function POST(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret || request.headers.get('authorization') !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const deleted = await reapExpiredTrials();
  return NextResponse.json({ data: { deleted, checkedAt: new Date().toISOString() } });
}
