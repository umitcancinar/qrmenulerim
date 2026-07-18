import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole, unauthorized } from '@/lib/guards';
import { reapExpiredTrials } from '@/lib/lifecycle';
import { slugify } from '@/lib/slug';
import { createTenantWithOwner, safeTenantInclude } from '@/lib/tenant-create';

const createTenantSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(60).optional(),
  ownerName: z.string().trim().min(2).max(80),
  username: z.string().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9_.-]+$/),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(40).optional(),
  status: z.enum(['ACTIVE', 'TRIAL']).default('ACTIVE'),
  starterMenu: z.boolean().default(true),
});

export async function GET() {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  await reapExpiredTrials();
  const tenants = await db.tenant.findMany({ orderBy: { createdAt: 'desc' }, include: safeTenantInclude });
  return NextResponse.json({ data: tenants });
}

export async function POST(request: Request) {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const body = await request.json().catch(() => null);
  const parsed = createTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return NextResponse.json({ error: 'INVALID_SLUG' }, { status: 400 });

  const [slugUsed, usernameUsed] = await Promise.all([
    db.tenant.findUnique({ where: { slug }, select: { id: true } }),
    db.user.findUnique({ where: { username: parsed.data.username }, select: { id: true } }),
  ]);
  if (slugUsed) return NextResponse.json({ error: 'SLUG_ALREADY_USED' }, { status: 409 });
  if (usernameUsed) return NextResponse.json({ error: 'USERNAME_ALREADY_USED' }, { status: 409 });

  try {
    const tenant = await createTenantWithOwner({ ...parsed.data, slug });
    return NextResponse.json({ data: tenant }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = String(error.meta?.target || '');
      return NextResponse.json({ error: target.includes('slug') ? 'SLUG_ALREADY_USED' : 'USERNAME_ALREADY_USED' }, { status: 409 });
    }
    console.error('Tenant creation failed', error);
    return NextResponse.json({ error: 'TENANT_CREATE_FAILED' }, { status: 500 });
  }
}
