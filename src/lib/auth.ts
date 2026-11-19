import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pool } from './db';
import { hashSession, opaqueKey, seal, sessionId, unseal } from './crypto';
import { HttpError } from './http';
import type { User } from './types';
export const cookieName = () => process.env.NODE_ENV === 'production' ? '__Host-ih_session' : 'ih_session';
type SessionRow = { sid: string; user_data: User; encrypted_token: string };
export async function getSession(): Promise<(SessionRow & { user: User; token: string }) | null> {
  const value = (await cookies()).get(cookieName())?.value;
  if (!value || !/^[a-zA-Z0-9_-]{43}$/.test(value)) return null;
  const { rows } = await pool().query<SessionRow>('SELECT sid, user_data, encrypted_token FROM insight_hub_private.sessions WHERE sid=$1 AND expires_at>now()', [hashSession(value)]);
  if (!rows[0]) return null;
  return { ...rows[0], user: rows[0].user_data, token: unseal(rows[0].encrypted_token) };
}
export async function requireSession(admin = false) {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'Sesi berakhir. Silakan login kembali.');
  if (admin && session.user.role !== 'admin') throw new HttpError(403, 'Halaman pengaturan hanya untuk admin.');
  return session;
}
export async function pageUser(admin = false) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (admin && session.user.role !== 'admin') redirect('/');
  return session.user;
}
export async function rateLimit(key: string, max: number, seconds = 900) {
  const { rows } = await pool().query<{ attempts: number }>(`
    INSERT INTO insight_hub_private.rate_limits (key, attempts, reset_at) VALUES ($1, 1, now()+make_interval(secs => $2))
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN insight_hub_private.rate_limits.reset_at <= now() THEN 1 ELSE insight_hub_private.rate_limits.attempts+1 END,
      reset_at = CASE WHEN insight_hub_private.rate_limits.reset_at <= now() THEN now()+make_interval(secs => $2) ELSE insight_hub_private.rate_limits.reset_at END
    RETURNING attempts`, [opaqueKey(key), seconds]);
  if (rows[0].attempts > max) throw new HttpError(429, 'Terlalu banyak percobaan. Silakan coba lagi nanti.');
}
export async function newSession(user: User, token: string) {
  if (!token) throw new Error('Legacy login did not return a session token');
  const id = sessionId();
  const ttl = Math.min(120, Math.max(5, Number(process.env.SESSION_TTL_MINUTES) || 30)) * 60;
  const old = (await cookies()).get(cookieName())?.value;
  const { transaction } = await import('./db');
  await transaction(async db => {
    if (old) await db.query('DELETE FROM insight_hub_private.sessions WHERE sid=$1', [hashSession(old)]);
    await db.query('INSERT INTO insight_hub_private.sessions(sid,user_id,user_data,encrypted_token,expires_at) VALUES($1,$2,$3,$4,now()+make_interval(secs => $5))', [hashSession(id), user.id, user, seal(token), ttl]);
    await db.query('DELETE FROM insight_hub_private.sessions WHERE expires_at<=now()');
    await db.query('DELETE FROM insight_hub_private.rate_limits WHERE reset_at<now()-interval \'1 day\'');
  });
  (await cookies()).set(cookieName(), id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: ttl });
}
export async function destroySession() {
  const jar = await cookies(), value = jar.get(cookieName())?.value;
  if (value) await pool().query('DELETE FROM insight_hub_private.sessions WHERE sid=$1', [hashSession(value)]);
  jar.delete(cookieName());
}
