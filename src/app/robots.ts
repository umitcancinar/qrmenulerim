import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://qrmenulerim.store';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/panel', '/superadmin'] },
    sitemap: `${base}/sitemap.xml`,
  };
}
