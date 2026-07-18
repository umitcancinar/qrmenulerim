import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/app-url';

export default function robots(): MetadataRoute.Robots {
  const base = appUrl;
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/panel', '/superadmin'] },
    sitemap: `${base}/sitemap.xml`,
  };
}
