import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSessionToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { reapExpiredTrials } from '@/lib/lifecycle';
import { slugify } from '@/lib/slug';
import { createTenantWithOwner } from '@/lib/tenant-create';

const trialSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(60).optional(),
  ownerName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(24).regex(/^[+0-9 ()-]+$/),
  username: z.string().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9_.-]+$/),
  password: z.string().min(8).max(128),
  accepted: z.literal(true),
});

type RateEntry = { count: number; resetAt: number };
const globalRateLimit = globalThis as typeof globalThis & { qrTrialRateLimit?: Map<string, RateEntry> };
const rateLimit = globalRateLimit.qrTrialRateLimit ?? new Map<string, RateEntry>();
globalRateLimit.qrTrialRateLimit = rateLimit;

function allowed(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
  const now = Date.now();
  const current = rateLimit.get(ip);
  if (!current || current.resetAt <= now) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (current.count >= 3) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!allowed(request)) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  await reapExpiredTrials();
  const parsed = trialSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return NextResponse.json({ error: 'INVALID_SLUG' }, { status: 400 });
  const [slugUsed, usernameUsed] = await Promise.all([
    db.tenant.findUnique({ where: { slug }, select: { id: true } }),
    db.user.findUnique({ where: { username: parsed.data.username }, select: { id: true } }),
  ]);
  if (slugUsed) return NextResponse.json({ error: 'SLUG_ALREADY_USED' }, { status: 409 });
  if (usernameUsed) return NextResponse.json({ error: 'USERNAME_ALREADY_USED' }, { status: 409 });

  try {
    const tenant = await createTenantWithOwner({
      name: parsed.data.name,
      slug,
      ownerName: parsed.data.ownerName,
      username: parsed.data.username,
      password: parsed.data.password,
      phone: parsed.data.phone,
      status: 'TRIAL',
      starterMenu: true,
    });
    const owner = tenant.users[0];
    const token = await createSessionToken({ userId: owner.id, tenantId: tenant.id, role: 'OWNER', username: owner.username });
    const response = NextResponse.json({ data: { redirectTo: '/panel', slug: tenant.slug, trialEndsAt: tenant.trialEndsAt } }, { status: 201 });
    response.cookies.set('qrmenulerim_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = String(error.meta?.target || '');
      return NextResponse.json({ error: target.includes('slug') ? 'SLUG_ALREADY_USED' : 'USERNAME_ALREADY_USED' }, { status: 409 });
    }
    console.error('Trial account creation failed', error);
    return NextResponse.json({ error: 'TRIAL_CREATE_FAILED' }, { status: 500 });
  }
}
