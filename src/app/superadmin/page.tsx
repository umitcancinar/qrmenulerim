import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentSession } from '@/lib/guards';
import SuperadminClient from '@/components/superadmin/SuperadminClient';

export default async function SuperadminPage() {
  const session = await currentSession();
  if (!session || session.role !== 'SUPERADMIN') redirect('/login');
  const tenants = await db.tenant.findMany({ orderBy: { createdAt: 'desc' }, include: { users: { select: { id: true, displayName: true, username: true, role: true, isActive: true } }, _count: { select: { products: true, categories: true } } } });
  return <SuperadminClient initialTenants={JSON.parse(JSON.stringify(tenants))} username={session.username} />;
}
