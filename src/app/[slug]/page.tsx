import MenuExperience from '@/components/menu/MenuExperience';
import { notFound } from 'next/navigation';
import { getPublicMenu } from '@/lib/menu';
import { tenantLifecycleBySlug, lifecycleDates } from '@/lib/lifecycle';
import ServiceState from '@/components/ServiceState';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const access = await tenantLifecycleBySlug(slug);
  if (!access) notFound();
  if (access.lifecycle === 'SUSPENDED') return <ServiceState kind="SUSPENDED" businessName={access.tenant.name} />;
  if (access.lifecycle === 'TRIAL_EXPIRED') {
    return <ServiceState kind="TRIAL_EXPIRED" businessName={access.tenant.name} deletionAt={lifecycleDates(access.tenant).scheduledDeletionAt} />;
  }
  if (access.lifecycle === 'DELETED') return <ServiceState kind="DELETED" businessName={access.tenant.name} />;
  const menu = await getPublicMenu(slug);
  if (!menu) notFound();
  return <MenuExperience menu={menu} />;
}
