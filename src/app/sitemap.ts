import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/app-url';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl;
  const fixed: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/deneme`, changeFrequency: 'monthly', priority: .9 },
    { url: `${base}/login`, changeFrequency: 'yearly', priority: .2 },
  ];
  try {
    const tenants = await db.tenant.findMany({ where: { status: 'ACTIVE' }, select: { slug: true, updatedAt: true } });
    return [...fixed, ...tenants.map((tenant) => ({ url: `${base}/${tenant.slug}`, lastModified: tenant.updatedAt, changeFrequency: 'daily' as const, priority: .8 }))];
  } catch {
    return fixed;
  }
}
