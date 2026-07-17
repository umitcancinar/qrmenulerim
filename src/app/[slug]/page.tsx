import MenuExperience from '@/components/menu/MenuExperience';
import { notFound } from 'next/navigation';
import { getPublicMenu } from '@/lib/menu';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  if (!menu) notFound();
  return <MenuExperience menu={menu} />;
}
