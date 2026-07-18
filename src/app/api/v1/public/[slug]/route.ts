import { NextResponse } from 'next/server';
import { getPublicMenu } from '@/lib/menu';
import { tenantLifecycleBySlug, lifecycleDates } from '@/lib/lifecycle';

const apiHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Cache-Control': 'no-store',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: apiHeaders });
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const access = await tenantLifecycleBySlug(slug);
  if (!access || access.lifecycle === 'DELETED') return NextResponse.json({ error: 'MENU_NOT_FOUND' }, { status: 404, headers: apiHeaders });
  if (access.lifecycle === 'SUSPENDED') return NextResponse.json({ error: 'MENU_SUSPENDED' }, { status: 423, headers: apiHeaders });
  if (access.lifecycle === 'TRIAL_EXPIRED') {
    return NextResponse.json({ error: 'TRIAL_EXPIRED', scheduledDeletionAt: lifecycleDates(access.tenant).scheduledDeletionAt }, { status: 423, headers: apiHeaders });
  }
  const menu = await getPublicMenu(slug, access.tenant.id);
  if (!menu) return NextResponse.json({ error: 'MENU_NOT_FOUND' }, { status: 404, headers: apiHeaders });

  return NextResponse.json({ data: menu }, {
    headers: apiHeaders,
  });
}
