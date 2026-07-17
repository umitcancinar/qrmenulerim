import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentSession, unauthorized } from '@/lib/guards';

const schema = z.object({ description: z.string().max(800).optional(), coverUrl: z.string().url().optional().or(z.literal('')), phone: z.string().max(40).optional(), address: z.string().max(240).optional(), eyebrow: z.string().max(80).optional(), tagline: z.string().max(160).optional(), instagram: z.string().max(80).optional(), openingHours: z.string().max(80).optional(), averageWait: z.string().max(80).optional(), announcement: z.string().max(240).optional(), menuApiUrl: z.string().url().optional().or(z.literal('')), menuApiEnabled: z.boolean().optional() });
const tenantFields = ['description', 'coverUrl', 'phone', 'address'] as const;

export async function PATCH(request: Request) {
  const session = await currentSession(); if (!session?.tenantId || !['OWNER', 'MANAGER'].includes(session.role)) return unauthorized();
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  const current = await db.tenant.findUnique({ where: { id: session.tenantId }, select: { settings: true } });
  if (!current) return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 });
  const oldSettings = current.settings && typeof current.settings === 'object' && !Array.isArray(current.settings) ? current.settings as Record<string, unknown> : {};
  const settings: Record<string, unknown> = {};
  const tenantData: Partial<Record<(typeof tenantFields)[number], string | null>> = {};

  for (const [key, value] of Object.entries(parsed.data)) {
    if ((tenantFields as readonly string[]).includes(key)) tenantData[key as (typeof tenantFields)[number]] = value ? String(value) : null;
    else settings[key] = value;
  }

  const tenant = await db.tenant.update({ where: { id: session.tenantId }, data: { ...tenantData, settings: { ...oldSettings, ...settings } } });
  return NextResponse.json({ data: tenant });
}
