import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentSession } from '@/lib/guards';
import SuperadminClient from '@/components/superadmin/SuperadminClient';
import { reapExpiredTrials } from '@/lib/lifecycle';
import { safeTenantInclude } from '@/lib/tenant-create';
import { ensureDefaultStandProducts } from '@/lib/stand-products';

export default async function SuperadminPage() {
  const session = await currentSession();
  if (!session || session.role !== 'SUPERADMIN') redirect('/login');
  await Promise.all([reapExpiredTrials(), ensureDefaultStandProducts()]);
  const [tenants, stands] = await Promise.all([
    db.tenant.findMany({ orderBy: { createdAt: 'desc' }, include: safeTenantInclude }),
    db.standProduct.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
  ]);
  return <SuperadminClient initialTenants={JSON.parse(JSON.stringify(tenants))} initialStandProducts={JSON.parse(JSON.stringify(stands))} username={session.username} />;
}
