import type { Metadata, Viewport } from 'next';
import { appUrl } from '@/lib/app-url';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: 'QR Menülerim — Restoranınız için yeni nesil dijital menü', template: '%s · QR Menülerim' },
  description: 'Ürünlerinizi, fiyatlarınızı ve görsellerinizi tek panelden yönetin. Mobil öncelikli QR menünüzü 24 saat boyunca tüm özellikleriyle ücretsiz deneyin.',
  keywords: ['QR menü', 'dijital menü', 'restoran menüsü', 'online menü', 'QR Menülerim'],
  authors: [{ name: 'Ümit Can Çınar', url: 'https://umitcancinar.me' }],
  creator: 'Ümit Can Çınar',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'tr_TR', siteName: 'QR Menülerim',
    title: 'Menünüz, markanız kadar iyi görünsün.',
    description: 'İşletmenize özel, mobil öncelikli yeni nesil QR menü deneyimi.',
    images: [{ url: '/og.png', width: 1728, height: 910, alt: 'QR Menülerim dijital menü platformu' }],
  },
  twitter: { card: 'summary_large_image', title: 'Menünüz, markanız kadar iyi görünsün.', description: 'İşletmenize özel, mobil öncelikli yeni nesil QR menü deneyimi.', images: ['/og.png'] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#121410', colorScheme: 'light dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
