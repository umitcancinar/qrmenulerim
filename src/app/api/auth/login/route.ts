import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSessionToken, verifyPassword } from '@/lib/auth';

const loginSchema = z.object({ username: z.string().min(3).max(40), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const body = loginSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  const user = await db.user.findUnique({ where: { username: body.data.username }, include: { tenant: { select: { slug: true } } } });
  if (!user || !user.isActive || !(await verifyPassword(body.data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
  }

  const token = await createSessionToken({ userId: user.id, tenantId: user.tenantId, role: user.role, username: user.username });
  const redirectTo = user.role === 'SUPERADMIN' ? '/superadmin' : '/panel';
  const response = NextResponse.json({ data: { redirectTo } });
  response.cookies.set('qrmenulerim_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return response;
}
