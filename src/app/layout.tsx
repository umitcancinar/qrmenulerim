import type { Metadata, Viewport } from 'next';
import { appUrl } from '@/lib/app-url';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: 'QR Menülerim — Restoran ve kafeler için kolay QR menü', template: '%s · QR Menülerim' },
  description: 'Fiyatları, ürünleri ve görselleri tek panelden güncelleyin. Misafirleriniz uygulama indirmeden hızlı ve anlaşılır menünüze ulaşsın.',
  keywords: ['QR menü', 'dijital menü', 'restoran menüsü', 'online menü', 'QR Menülerim'],
  authors: [{ name: 'Ümican Çınar', url: 'https://umitcancinar.me' }],
  creator: 'Ümican Çınar',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'tr_TR', siteName: 'QR Menülerim',
    title: 'Menünüz her masada güncel.',
    description: 'Restoran ve kafeler için kolay yönetilen, hızlı ve işletmeye özel QR menü.',
    images: [{ url: '/og.png', width: 1728, height: 910, alt: 'QR Menülerim dijital menü platformu' }],
  },
  twitter: { card: 'summary_large_image', title: 'Menünüz her masada güncel.', description: 'Restoran ve kafeler için kolay yönetilen, hızlı ve işletmeye özel QR menü.', images: ['/og.png'] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#121410', colorScheme: 'light dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
