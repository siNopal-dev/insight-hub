import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { id: '/', name: 'Insight Hub — PT. Prima Fara Textile', short_name: 'Insight Hub', description: 'Portal Dashboard Analitik PT. Prima Fara Textile',
    lang: 'id', start_url: '/', scope: '/', display: 'standalone', orientation: 'any', background_color: '#f4f6fa', theme_color: '#162e6e',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
  };
}
