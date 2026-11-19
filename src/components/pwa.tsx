'use client';
import { useEffect, useState } from 'react';
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export function Pwa() {
  const [offline, setOffline] = useState(false), [install, setInstall] = useState<InstallEvent | null>(null), [update, setUpdate] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    const network = () => setOffline(!navigator.onLine); network();
    const before = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    const installed = () => setInstall(null);
    window.addEventListener('online', network); window.addEventListener('offline', network); window.addEventListener('beforeinstallprompt', before); window.addEventListener('appinstalled', installed);
    let reload = false;
    const changed = () => { if (reload) window.location.reload(); };
    const updating = () => { reload = true; };
    window.addEventListener('ih-update', updating);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.addEventListener('controllerchange', changed);
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(reg => {
        if (reg.waiting) setUpdate(reg.waiting);
        reg.addEventListener('updatefound', () => { const worker = reg.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdate(worker); }); });
      }).catch(() => { /* App remains usable when browser policy blocks PWA. */ });
    }
    return () => { window.removeEventListener('online', network); window.removeEventListener('offline', network); window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', installed); window.removeEventListener('ih-update', updating); navigator.serviceWorker?.removeEventListener('controllerchange', changed); };
  }, []);
  if (!offline && !update) return null;
  return <aside className="pwa-bar" aria-live="polite">{offline ? <span>Koneksi terputus. Laporan memerlukan internet.</span> : update ? <><span>Versi baru tersedia. Simpan perubahan sebelum memperbarui.</span><button onClick={() => { window.dispatchEvent(new Event('ih-update')); update.postMessage({ type: 'SKIP_WAITING' }); }} className="button primary">Perbarui</button></> : <><span>Akses Insight Hub dari layar utama.</span><button className="button primary" onClick={async () => { await install?.prompt(); await install?.userChoice; setInstall(null); }}>Pasang Aplikasi</button><button aria-label="Tutup tawaran instalasi" className="dismiss" onClick={() => setInstall(null)}>×</button></>}</aside>;
}
