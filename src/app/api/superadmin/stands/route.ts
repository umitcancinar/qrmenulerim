import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole, unauthorized } from '@/lib/guards';
import { ensureDefaultStandProducts, standVisualStyles } from '@/lib/stand-products';
import { slugify } from '@/lib/slug';

const standSchema = z.object({
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
  visualStyle: z.enum(standVisualStyles).default('obsidian'),
  price: z.union([z.number().nonnegative().max(9999999), z.null()]).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

async function uniqueSlug(name: string) {
  const base = slugify(name) || 'stand-urunu';
  let candidate = base;
  let suffix = 2;
  while (await db.standProduct.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function GET() {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  await ensureDefaultStandProducts();
  const products = await db.standProduct.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  return NextResponse.json({ data: products });
}

export async function POST(request: Request) {
  if (!(await requireRole('SUPERADMIN'))) return unauthorized();
  const parsed = standSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const product = await db.standProduct.create({
    data: {
      ...parsed.data,
      slug: await uniqueSlug(parsed.data.name),
      imageUrl: parsed.data.imageUrl || null,
      price: parsed.data.price ?? null,
    },
  });
  return NextResponse.json({ data: product }, { status: 201 });
}
