import { NextResponse } from 'next/server';
import { getPublicMenu } from '@/lib/menu';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  if (!menu) return NextResponse.json({ error: 'MENU_NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ data: menu }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
