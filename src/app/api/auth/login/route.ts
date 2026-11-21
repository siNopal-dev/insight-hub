import { rateLimit } from '@/lib/rate-limit';
import { verifyPassword } from '@/lib/passwords';
import { pool } from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { newSession } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';
import { failure, HttpError, jsonBody, reply } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const { username, password } = loginSchema.parse(await jsonBody(request));
    await rateLimit('login:global', 1000);
    if (process.env.TRUST_PROXY_IP === 'true')
      await rateLimit(
        'login:ip:' + (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'),
        40,
      );
    await rateLimit('login:account:' + username.toLowerCase(), 8);
    const { rows } = await pool().query<{ id: string; password_hash: string | null }>(
      'SELECT id,password_hash FROM public.profiles WHERE lower(username)=lower($1) LIMIT 2',
      [username],
    );
    const account = rows.length === 1 ? rows[0] : null;
    const valid = await verifyPassword(password, account?.password_hash || null);
    if (!valid || !account?.password_hash)
      throw new HttpError(401, 'Username atau kata sandi salah, atau akun belum aktif.');
    const user = await getProfile(account.id);
    if (!user) throw new HttpError(401, 'Username atau kata sandi salah, atau akun belum aktif.');
    await newSession(user, account.password_hash);
    return reply({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
