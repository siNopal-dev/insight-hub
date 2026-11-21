import type { Metadata, Viewport } from 'next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './globals.css';
import { Pwa } from '@/components/pwa';
export const metadata: Metadata = {
  title: { default: 'Insight Hub — PT. Prima Fara Textile', template: '%s | Insight Hub' },
  description: 'Portal Dashboard Analitik PT. Prima Fara Textile',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Insight Hub' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  themeColor: '#162e6e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a href="#main" className="skip-link">
          Lewati ke konten
        </a>
        {children}
        <Pwa />
      </body>
    </html>
  );
}
