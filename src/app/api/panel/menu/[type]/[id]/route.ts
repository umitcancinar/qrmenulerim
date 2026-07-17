import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentSession, unauthorized } from '@/lib/guards';
import { z } from 'zod';

const categorySchema = z.object({ name: z.string().min(2).max(80), description: z.string().max(240).optional(), imageUrl: z.string().url().optional().or(z.literal('')) });
const productSchema = z.object({ name: z.string().min(2).max(100), description: z.string().max(500).optional(), imageUrl: z.string().url().optional().or(z.literal('')), kicker: z.string().max(40).optional(), price: z.coerce.number().min(0).max(999999), preparationMin: z.coerce.number().int().min(0).max(999).optional(), calories: z.coerce.number().int().min(0).max(9999).optional(), badges: z.array(z.string().max(30)).max(6).optional(), allergens: z.array(z.string().max(40)).max(12).optional(), ingredients: z.array(z.string().max(50)).max(20).optional(), isFeatured: z.boolean().optional() });

async function editableSession() { const session = await currentSession(); return session?.tenantId && ['OWNER', 'MANAGER'].includes(session.role) ? session : null; }

export async function PATCH(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const session = await editableSession(); if (!session) return unauthorized();
  const { type, id } = await params; const body = await request.json();
  if (type === 'categories') {
    const parsed = categorySchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    const category = await db.menuCategory.updateMany({ where: { id, tenantId: session.tenantId }, data: { name: parsed.data.name, description: parsed.data.description || null, imageUrl: parsed.data.imageUrl || null } });
    if (!category.count) return NextResponse.json({ error: 'CATEGORY_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ data: await db.menuCategory.findUnique({ where: { id } }) });
  }
  if (type === 'products') {
    const parsed = productSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    const product = await db.product.updateMany({ where: { id, tenantId: session.tenantId }, data: { name: parsed.data.name, description: parsed.data.description || null, imageUrl: parsed.data.imageUrl || null, kicker: parsed.data.kicker || null, price: parsed.data.price, preparationMin: parsed.data.preparationMin, calories: parsed.data.calories, badges: parsed.data.badges || [], allergens: parsed.data.allergens || [], ingredients: parsed.data.ingredients || [], isFeatured: parsed.data.isFeatured || false } });
    if (!product.count) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ data: await db.product.findUnique({ where: { id } }) });
  }
  return NextResponse.json({ error: 'INVALID_RESOURCE' }, { status: 400 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const session = await editableSession(); if (!session) return unauthorized();
  const { type, id } = await params;
  if (type === 'categories') await db.menuCategory.deleteMany({ where: { id, tenantId: session.tenantId } });
  else if (type === 'products') await db.product.deleteMany({ where: { id, tenantId: session.tenantId } });
  else return NextResponse.json({ error: 'INVALID_RESOURCE' }, { status: 400 });
  return NextResponse.json({ data: { ok: true } });
}
