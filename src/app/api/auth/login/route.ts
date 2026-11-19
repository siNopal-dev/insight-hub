import { pool } from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { newSession, rateLimit } from '@/lib/auth';
import { failure, HttpError, jsonBody, reply } from '@/lib/http';
import type { User } from '@/lib/types';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const { username, password } = loginSchema.parse(await jsonBody(request));
    await rateLimit('login:global', 1000);
    if (process.env.TRUST_PROXY_IP === 'true') await rateLimit('login:ip:' + (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'), 40);
    await rateLimit('login:account:' + username.toLowerCase(), 8);
    const { rows } = await pool().query('SELECT * FROM public.login_pengguna($1,$2)', [username, password]);
    const row = rows[0];
    if (!row || row.id == null || !row.username) throw new HttpError(401, 'Username atau kata sandi salah.');
    const role = String(row.role || 'user').toLowerCase();
    if (!['admin', 'user'].includes(role)) throw new HttpError(403, 'Akun tidak memiliki akses portal.');
    const user: User = { id: String(row.id), username: String(row.username), name: String(row.nama_lengkap || row.username), role: role as User['role'] };
    await newSession(user, String(row.session_token || row.token || ''));
    return reply({ ok: true });
  } catch (e) { return failure(e); }
}
