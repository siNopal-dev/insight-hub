import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
function key() {
  const raw = Buffer.from(process.env.SESSION_ENCRYPTION_KEY || '', 'base64');
  if (raw.length !== 32) throw new Error('SESSION_ENCRYPTION_KEY must be 32 bytes');
  return raw;
}
export function sessionId() { return randomBytes(32).toString('base64url'); }
export function hashSession(value: string) { return createHash('sha256').update(value).digest('hex'); }
export function opaqueKey(value: string) { return createHmac('sha256', key()).update(value).digest('hex'); }
export function seal(value: string) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
export function unseal(value: string) {
  const raw = Buffer.from(value, 'base64url');
  if (raw.length < 28) throw new Error('Invalid sealed value');
  const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}
