import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/guards';
import { db } from '@/lib/db';
import PanelClient from '@/components/panel/PanelClient';
import ServiceState from '@/components/ServiceState';
import { tenantLifecycleById } from '@/lib/lifecycle';

export default async function PanelPage() {
  const session = await currentSession();
  if (!session || !session.tenantId) redirect('/login');
  const access = await tenantLifecycleById(session.tenantId);
  if (!access) redirect('/login');
  if (access.lifecycle === 'SUSPENDED') return <ServiceState kind="SUSPENDED" businessName={access.tenant.name} panel />;
  if (access.lifecycle === 'TRIAL_EXPIRED') return <ServiceState kind="TRIAL_EXPIRED" businessName={access.tenant.name} deletionAt={access.scheduledDeletionAt} panel />;
  if (access.lifecycle === 'DELETED') return <ServiceState kind="DELETED" businessName={access.tenant.name} panel />;
  const tenant = await db.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true, slug: true, status: true, trialEndsAt: true, logoUrl: true, description: true, coverUrl: true, phone: true, address: true, settings: true } });
  if (!tenant) redirect('/login');
  const categories = await db.menuCategory.findMany({ where: { tenantId: session.tenantId }, orderBy: { sortOrder: 'asc' }, include: { products: { orderBy: { sortOrder: 'asc' } } } });
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { username: true, displayName: true } });
  return <PanelClient tenant={JSON.parse(JSON.stringify(tenant))} initialCategories={JSON.parse(JSON.stringify(categories))} user={user || { username: session.username, displayName: session.username }} />;
}
