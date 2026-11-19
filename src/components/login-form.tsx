'use client';
import { useState } from 'react';
import { api } from './api';
export function LoginForm() {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [visible, setVisible] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; const form = event.currentTarget, data = new FormData(form);
    setBusy(true); setError('');
    try { await api('/api/auth/login', 'POST', { username: data.get('username'), password: data.get('password') }); form.reset(); window.location.replace('/'); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <form onSubmit={submit} className="form-stack">{error && <div role="alert" className="notice error">{error}</div>}<label>Username<input name="username" autoComplete="username" maxLength={100} required autoCapitalize="none" spellCheck={false} /></label><label>Kata sandi<div className="password-field"><input name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required maxLength={256} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={visible}>{visible ? 'Sembunyikan' : 'Lihat'}</button></div></label><button className="button primary wide" disabled={busy}>{busy ? 'Memeriksa akun…' : 'Masuk'}</button></form>;
}
