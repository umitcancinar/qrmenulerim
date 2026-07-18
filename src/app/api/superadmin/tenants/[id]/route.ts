import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { requireRole, unauthorized } from '@/lib/guards';
import { lifecycleUpdate } from '@/lib/lifecycle';
import { safeTenantInclude } from '@/lib/tenant-create';

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL']).optional(),
  ownerName: z.string().trim().min(2).max(80).optional(),
  username: z.string().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9_.-]+$/).optional(),
  password: z.string().min(8).max(128).optional(),
  restartTrial: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const tenant = await db.tenant.findUnique({ where: { id }, include: { users: { where: { role: 'OWNER' }, take: 1 } } });
  if (!tenant || !tenant.users[0]) return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 });

  if (parsed.data.username) {
    const used = await db.user.findFirst({ where: { username: parsed.data.username, NOT: { id: tenant.users[0].id } }, select: { id: true } });
    if (used) return NextResponse.json({ error: 'USERNAME_ALREADY_USED' }, { status: 409 });
  }

  try {
    await db.$transaction(async (tx) => {
      const statusData = parsed.data.status
        ? lifecycleUpdate(parsed.data.status, parsed.data.restartTrial ? undefined : tenant.status)
        : {};
      await tx.tenant.update({ where: { id }, data: { name: parsed.data.name, ...statusData } });
      await tx.user.update({
        where: { id: tenant.users[0].id },
        data: {
          displayName: parsed.data.ownerName,
          username: parsed.data.username,
          ...(parsed.data.password ? { passwordHash: await hashPassword(parsed.data.password) } : {}),
        },
      });
    });
    const updated = await db.tenant.findUniqueOrThrow({ where: { id }, include: safeTenantInclude });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'USERNAME_ALREADY_USED' }, { status: 409 });
    }
    console.error('Tenant update failed', error);
    return NextResponse.json({ error: 'TENANT_UPDATE_FAILED' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const { id } = await params;
  const parsed = z.object({ confirmation: z.string() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'CONFIRMATION_REQUIRED' }, { status: 400 });
  const tenant = await db.tenant.findUnique({ where: { id }, select: { name: true } });
  if (!tenant) return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 });
  if (parsed.data.confirmation !== tenant.name) return NextResponse.json({ error: 'CONFIRMATION_MISMATCH' }, { status: 400 });
  await db.tenant.delete({ where: { id } });
  return NextResponse.json({ data: { deleted: true } });
}
