import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QR Menülerim — Menü deneyimini yeniden tasarla',
  description: 'Modern, dinamik ve çok kiracılı QR menü altyapısı.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
