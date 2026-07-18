import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readSessionToken, type Session } from '@/lib/auth';
import { tenantLifecycleById } from '@/lib/lifecycle';

export async function currentSession(): Promise<Session | null> {
  const token = (await cookies()).get('qrmenulerim_session')?.value;
  return token ? readSessionToken(token) : null;
}

export async function requireRole(...roles: Session['role'][]) {
  const session = await currentSession();
  if (!session || !roles.includes(session.role)) return null;
  return session;
}

export async function editableTenantSession() {
  const session = await currentSession();
  if (!session?.tenantId || !['OWNER', 'MANAGER'].includes(session.role)) return null;
  const access = await tenantLifecycleById(session.tenantId);
  if (!access || !['ACTIVE', 'TRIAL_ACTIVE'].includes(access.lifecycle)) return null;
  return { session: session as Session & { tenantId: string }, access };
}

export const unauthorized = () => NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
