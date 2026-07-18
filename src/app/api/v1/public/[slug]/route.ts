import { NextResponse } from 'next/server';
import { getPublicMenu } from '@/lib/menu';
import { tenantLifecycleBySlug, lifecycleDates } from '@/lib/lifecycle';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const access = await tenantLifecycleBySlug(slug);
  if (!access || access.lifecycle === 'DELETED') return NextResponse.json({ error: 'MENU_NOT_FOUND' }, { status: 404 });
  if (access.lifecycle === 'SUSPENDED') return NextResponse.json({ error: 'MENU_SUSPENDED' }, { status: 423 });
  if (access.lifecycle === 'TRIAL_EXPIRED') {
    return NextResponse.json({ error: 'TRIAL_EXPIRED', scheduledDeletionAt: lifecycleDates(access.tenant).scheduledDeletionAt }, { status: 423 });
  }
  const menu = await getPublicMenu(slug);
  if (!menu) return NextResponse.json({ error: 'MENU_NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ data: menu }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
