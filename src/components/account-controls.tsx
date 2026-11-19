'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from './api';
import type { User } from '@/lib/types';
export function AccountControls({ user, settings }: { user: User; settings: boolean }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ih-auth') : null;
    if (channel) channel.onmessage = () => window.location.replace('/login');
    const back = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); };
    async function check() { if (document.hidden) return; try { const r = await fetch('/api/auth/session', { cache: 'no-store' }); if (r.status === 401) window.location.replace('/login'); } catch { /* Offline does not revoke the server session. */ } }
    window.addEventListener('pageshow', back); document.addEventListener('visibilitychange', check);
    const timer = setInterval(check, 60000);
    return () => { channel?.close(); clearInterval(timer); window.removeEventListener('pageshow', back); document.removeEventListener('visibilitychange', check); };
  }, []);
  async function logout() { setBusy(true); setError(''); try { await api('/api/auth/logout', 'POST', {}); if (typeof BroadcastChannel !== 'undefined') { const c = new BroadcastChannel('ih-auth'); c.postMessage('logout'); c.close(); } window.location.replace('/login'); } catch (e) { setError((e as Error).message); setBusy(false); } }
  return <div className="account"><span className="user-badge">{user.name} <b>({user.role})</b></span>{user.role === 'admin' && <Link className="nav-button" prefetch={false} href={settings ? '/' : '/setting'}>{settings ? 'Beranda' : 'Pengaturan'}</Link>}<button className="nav-button logout" onClick={logout} disabled={busy}>{busy ? 'Keluar…' : 'Keluar'}</button>{error && <p role="alert" className="header-error">{error}</p>}</div>;
}
