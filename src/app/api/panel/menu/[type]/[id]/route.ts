import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentSession, unauthorized } from '@/lib/guards';

export async function DELETE(_: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const session = await currentSession(); if (!session?.tenantId || !['OWNER', 'MANAGER'].includes(session.role)) return unauthorized();
  const { type, id } = await params;
  if (type === 'categories') await db.menuCategory.deleteMany({ where: { id, tenantId: session.tenantId } });
  else if (type === 'products') await db.product.deleteMany({ where: { id, tenantId: session.tenantId } });
  else return NextResponse.json({ error: 'INVALID_RESOURCE' }, { status: 400 });
  return NextResponse.json({ data: { ok: true } });
}
