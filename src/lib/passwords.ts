import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 64, options, (e, key) => (e ? reject(e) : resolve(key))),
  );
}
export async function hashPassword(password: string) {
  if (password.length < 5 || password.length > 128)
    throw new Error('Password harus 5–128 karakter.');
  const salt = randomBytes(16).toString('hex');
  return `scrypt$32768$8$1$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string | null) {
  const match = stored?.match(/^scrypt\$32768\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/);
  const actual = await derive(password, match?.[1] || '0'.repeat(32));
  const expected = Buffer.from(match?.[2] || '0'.repeat(128), 'hex');
  return timingSafeEqual(actual, expected) && !!match;
}
