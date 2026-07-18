import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentSession } from '@/lib/guards';
import SuperadminClient from '@/components/superadmin/SuperadminClient';
import { reapExpiredTrials } from '@/lib/lifecycle';
import { safeTenantInclude } from '@/lib/tenant-create';

export default async function SuperadminPage() {
  const session = await currentSession();
  if (!session || session.role !== 'SUPERADMIN') redirect('/login');
  await reapExpiredTrials();
  const tenants = await db.tenant.findMany({ orderBy: { createdAt: 'desc' }, include: safeTenantInclude });
  return <SuperadminClient initialTenants={JSON.parse(JSON.stringify(tenants))} username={session.username} />;
}
