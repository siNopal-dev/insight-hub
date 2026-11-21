import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pool } from './db';
import { hashSession, sessionId } from './crypto';
import { HttpError } from './http';
import { cache } from 'react';
import { sessionSelect, sessionUser, type SessionRecord } from './session-record';
import type { User } from './types';
export const cookieName = () =>
  process.env.NODE_ENV === 'production' ? '__Host-ih_session' : 'ih_session';
// React cache deduplicates only within a server render; no cross-request cache.
export const getSession = cache(async () => {
  const value = (await cookies()).get(cookieName())?.value;
  if (!value || !/^[a-zA-Z0-9_-]{43}$/.test(value)) return null;
  const { rows } = await pool().query<SessionRecord>(sessionSelect, [hashSession(value)]);
  const row = rows[0];
  const user = row ? sessionUser(row) : null;
  return user && row ? { sid: row.sid, user } : null;
});
export async function requireSession(admin = false) {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'Sesi berakhir. Silakan login kembali.');
  if (admin && session.user.role !== 'admin')
    throw new HttpError(403, 'Halaman pengaturan hanya untuk admin.');
  return session;
}
export async function pageUser(admin = false) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (admin && session.user.role !== 'admin') redirect('/');
  return session.user;
}
export async function newSession(user: User, passwordHash: string) {
  const id = sessionId();
  const configured = Math.min(120, Math.max(5, Number(process.env.SESSION_TTL_MINUTES) || 30)) * 60;
  const ttl = configured;
  if (!Number.isFinite(ttl) || ttl < 1) throw new Error('Invalid authentication expiry');
  const old = (await cookies()).get(cookieName())?.value;
  const { transaction } = await import('./db');
  await transaction(async (db) => {
    if (old)
      await db.query('DELETE FROM insight_hub_private.sessions WHERE sid=$1', [hashSession(old)]);
    await db.query(
      'INSERT INTO insight_hub_private.sessions(sid,user_id,user_data,encrypted_token,expires_at) VALUES($1,$2,$3,$4,now()+make_interval(secs => $5))',
      [
        hashSession(id),
        user.id,
        { ...user, auth_provider: 'profiles', credential_tag: hashSession(passwordHash) },
        '',
        ttl,
      ],
    );
    await db.query('DELETE FROM insight_hub_private.sessions WHERE expires_at<=now()');
    await db.query(
      "DELETE FROM insight_hub_private.rate_limits WHERE reset_at<now()-interval '1 day'",
    );
  });
  (await cookies()).set(cookieName(), id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ttl,
  });
}
export async function destroySession() {
  const jar = await cookies(),
    value = jar.get(cookieName())?.value;
  if (value)
    await pool().query('DELETE FROM insight_hub_private.sessions WHERE sid=$1', [
      hashSession(value),
    ]);
  jar.delete(cookieName());
}
