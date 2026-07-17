import MenuExperience from '@/components/menu/MenuExperience';
import { demoMenu } from '@/data/demo-menu';

export default async function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  return <MenuExperience menu={demoMenu} />;
}
