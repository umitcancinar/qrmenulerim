import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/guards';
import { db } from '@/lib/db';
import PanelClient from '@/components/panel/PanelClient';

export default async function PanelPage() {
  const session = await currentSession();
  if (!session || !session.tenantId) redirect('/login');
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true, slug: true, logoUrl: true, description: true, coverUrl: true, phone: true, address: true, settings: true } });
  if (!tenant) redirect('/login');
  const categories = await db.menuCategory.findMany({ where: { tenantId: session.tenantId }, orderBy: { sortOrder: 'asc' }, include: { products: { orderBy: { sortOrder: 'asc' } } } });
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { username: true, displayName: true } });
  return <PanelClient tenant={JSON.parse(JSON.stringify(tenant))} initialCategories={JSON.parse(JSON.stringify(categories))} user={user || { username: session.username, displayName: session.username }} />;
}
