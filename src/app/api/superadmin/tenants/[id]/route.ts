import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { requireRole, unauthorized } from '@/lib/guards';

const updateSchema = z.object({ name: z.string().min(2).max(100).optional(), status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL']).optional(), ownerName: z.string().min(2).max(80).optional(), username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/).optional(), password: z.string().min(8).max(128).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const { id } = await params; const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  const tenant = await db.tenant.findUnique({ where: { id }, include: { users: { where: { role: 'OWNER' }, take: 1 } } });
  if (!tenant || !tenant.users[0]) return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 });
  if (parsed.data.username) { const used = await db.user.findFirst({ where: { username: parsed.data.username, NOT: { id: tenant.users[0].id } } }); if (used) return NextResponse.json({ error: 'USERNAME_ALREADY_USED' }, { status: 409 }); }
  await db.$transaction(async (tx: any) => {
    await tx.tenant.update({ where: { id }, data: { name: parsed.data.name, status: parsed.data.status } });
    await tx.user.update({ where: { id: tenant.users[0].id }, data: { displayName: parsed.data.ownerName, username: parsed.data.username, ...(parsed.data.password ? { passwordHash: await hashPassword(parsed.data.password) } : {}) } });
  });
  const updated = await db.tenant.findUnique({
    where: { id },
    include: { users: { select: { id: true, displayName: true, username: true, role: true, isActive: true } }, _count: { select: { products: true, categories: true } } },
  });
  return NextResponse.json({ data: updated });
}
