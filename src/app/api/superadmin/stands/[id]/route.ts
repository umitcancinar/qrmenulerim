import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole, unauthorized } from '@/lib/guards';
import { standVisualStyles } from '@/lib/stand-products';

const updateStandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(600),
  material: z.string().trim().min(2).max(140),
  dimensions: z.string().trim().min(2).max(80),
  imageUrl: z.union([
    z.string().trim().url(),
    z.string().trim().regex(/^\/[A-Za-z0-9/_\-.]+$/),
    z.literal(''),
    z.null(),
  ]).optional(),
  visualStyle: z.enum(standVisualStyles),
  price: z.union([z.number().nonnegative().max(9999999), z.null()]).optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const parsed = updateStandSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { id } = await params;

  const existing = await db.standProduct.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const product = await db.standProduct.update({
    where: { id },
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null,
      price: parsed.data.price ?? null,
    },
  });
  return NextResponse.json({ data: product });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const { id } = await params;
  const existing = await db.standProduct.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  await db.standProduct.delete({ where: { id } });
  return NextResponse.json({ data: { id } });
}
