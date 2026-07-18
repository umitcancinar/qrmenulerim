import type { Metadata, Viewport } from 'next';
import { appUrl } from '@/lib/app-url';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: 'QR Menülerim — Menü değil, marka deneyimi', template: '%s · QR Menülerim' },
  description: 'Restoranınız için hızlı, zarif ve satışa odaklı dijital QR menü. 24 saat boyunca tüm özellikleri ücretsiz deneyin.',
  keywords: ['QR menü', 'dijital menü', 'restoran menüsü', 'online menü', 'QR Menülerim'],
  authors: [{ name: 'Ümit Can Çınar', url: 'https://umitcancinar.me' }],
  creator: 'Ümit Can Çınar',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'tr_TR', siteName: 'QR Menülerim',
    title: 'QR Menülerim — Menü değil, marka deneyimi',
    description: 'İşletmenize özel, yeni nesil dijital menü deneyimi.',
    images: [{ url: '/og.png', width: 1728, height: 910, alt: 'QR Menülerim dijital menü platformu' }],
  },
  twitter: { card: 'summary_large_image', title: 'QR Menülerim — Menü değil, marka deneyimi', description: 'İşletmenize özel, yeni nesil dijital menü deneyimi.', images: ['/og.png'] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#121410', colorScheme: 'light dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
