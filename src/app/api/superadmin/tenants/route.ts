import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { requireRole, unauthorized } from '@/lib/guards';
import { slugify } from '@/lib/slug';

const createTenantSchema = z.object({
  name: z.string().min(2).max(100), slug: z.string().min(2).max(60).optional(),
  ownerName: z.string().min(2).max(80), username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/), password: z.string().min(8).max(128),
});

export async function GET() {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const tenants = await db.tenant.findMany({ orderBy: { createdAt: 'desc' }, include: { users: { select: { id: true, displayName: true, username: true, role: true, isActive: true } }, _count: { select: { products: true, categories: true } } } });
  return NextResponse.json({ data: tenants });
}

export async function POST(request: Request) {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const parsed = createTenantSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, { status: 400 });
  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return NextResponse.json({ error: 'INVALID_SLUG' }, { status: 400 });
  const [slugUsed, usernameUsed] = await Promise.all([db.tenant.findUnique({ where: { slug } }), db.user.findUnique({ where: { username: parsed.data.username } })]);
  if (slugUsed) return NextResponse.json({ error: 'SLUG_ALREADY_USED' }, { status: 409 });
  if (usernameUsed) return NextResponse.json({ error: 'USERNAME_ALREADY_USED' }, { status: 409 });

  const tenant = await db.tenant.create({ data: { name: parsed.data.name, slug, status: 'ACTIVE', users: { create: { username: parsed.data.username, displayName: parsed.data.ownerName, passwordHash: await hashPassword(parsed.data.password), role: 'OWNER' } } }, include: { users: true, _count: { select: { products: true, categories: true } } } });
  return NextResponse.json({ data: tenant }, { status: 201 });
}
