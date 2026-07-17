import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentSession, unauthorized } from '@/lib/guards';

const categorySchema = z.object({ name: z.string().min(2).max(80), description: z.string().max(240).optional(), imageUrl: z.string().url().optional().or(z.literal('')) });
const productSchema = z.object({ categoryId: z.string().min(1), name: z.string().min(2).max(100), description: z.string().max(500).optional(), imageUrl: z.string().url().optional().or(z.literal('')), kicker: z.string().max(40).optional(), price: z.coerce.number().min(0).max(999999), preparationMin: z.coerce.number().int().min(0).max(999).optional(), calories: z.coerce.number().int().min(0).max(9999).optional(), badges: z.array(z.string().max(30)).max(6).optional(), allergens: z.array(z.string().max(40)).max(12).optional(), ingredients: z.array(z.string().max(50)).max(20).optional(), isFeatured: z.boolean().optional() });

async function tenantSession() { const session = await currentSession(); return session && session.tenantId && ['OWNER', 'MANAGER'].includes(session.role) ? session : null; }

export async function GET() {
  const session = await tenantSession(); if (!session) return unauthorized();
  const categories = await db.menuCategory.findMany({ where: { tenantId: session.tenantId! }, orderBy: { sortOrder: 'asc' }, include: { products: { orderBy: { sortOrder: 'asc' } } } });
  return NextResponse.json({ data: categories });
}

export async function POST(request: Request) {
  const session = await tenantSession(); if (!session) return unauthorized();
  const body = await request.json();
  if (body.type === 'category') {
    const parsed = categorySchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    const category = await db.menuCategory.create({ data: { tenantId: session.tenantId!, name: parsed.data.name, description: parsed.data.description, imageUrl: parsed.data.imageUrl || null, sortOrder: await db.menuCategory.count({ where: { tenantId: session.tenantId! } }) + 1 } });
    return NextResponse.json({ data: category }, { status: 201 });
  }
  const parsed = productSchema.safeParse(body); if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  const category = await db.menuCategory.findFirst({ where: { id: parsed.data.categoryId, tenantId: session.tenantId! } }); if (!category) return NextResponse.json({ error: 'CATEGORY_NOT_FOUND' }, { status: 404 });
  const product = await db.product.create({ data: { tenantId: session.tenantId!, categoryId: parsed.data.categoryId, name: parsed.data.name, description: parsed.data.description, imageUrl: parsed.data.imageUrl || null, kicker: parsed.data.kicker || null, price: parsed.data.price, preparationMin: parsed.data.preparationMin, calories: parsed.data.calories, badges: parsed.data.badges || [], allergens: parsed.data.allergens || [], ingredients: parsed.data.ingredients || [], isFeatured: parsed.data.isFeatured || false, sortOrder: await db.product.count({ where: { tenantId: session.tenantId!, categoryId: parsed.data.categoryId } }) + 1 } });
  return NextResponse.json({ data: product }, { status: 201 });
}
