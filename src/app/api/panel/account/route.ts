import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSessionToken, hashPassword } from '@/lib/auth';
import { currentSession, unauthorized } from '@/lib/guards';

const updateSchema = z.object({ username: z.string().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9_.-]+$/).optional(), displayName: z.string().trim().min(2).max(80).optional(), password: z.string().min(8).max(128).optional() });

export async function PATCH(request: Request) {
  const session = await currentSession();
  if (!session) return unauthorized();
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  if (parsed.data.username && parsed.data.username !== session.username) {
    const existing = await db.user.findUnique({ where: { username: parsed.data.username } });
    if (existing) return NextResponse.json({ error: 'USERNAME_ALREADY_USED' }, { status: 409 });
  }
  const user = await db.user.update({ where: { id: session.userId }, data: { username: parsed.data.username, displayName: parsed.data.displayName, ...(parsed.data.password ? { passwordHash: await hashPassword(parsed.data.password) } : {}) }, select: { id: true, username: true, displayName: true, role: true } });
  const token = await createSessionToken({ userId: user.id, tenantId: session.tenantId, role: user.role, username: user.username });
  const response = NextResponse.json({ data: user });
  response.cookies.set('qrmenulerim_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return response;
}
