import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { database, reportError } from './db.mjs';
import { hashPassword } from '../src/lib/passwords.ts';
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: true });
const db = database();
try {
  if (!process.stdin.isTTY) throw new Error('Gunakan terminal interaktif.');
  const username = (await rl.question('Username profil: ')).trim();
  process.stdout.write('Password baru (5–128 karakter, input tersembunyi): ');
  muted = true;
  const password = await rl.question('');
  muted = false;
  process.stdout.write('\n');
  process.stdout.write('Ulangi password: ');
  muted = true;
  const confirm = await rl.question('');
  muted = false;
  process.stdout.write('\n');
  if (password !== confirm) throw new Error('Konfirmasi password tidak sama.');
  const hash = await hashPassword(password);
  await db.connect();
  await db.query('BEGIN');
  const result = await db.query(
    'UPDATE public.profiles SET password_hash=$1 WHERE lower(username)=lower($2) RETURNING id',
    [hash, username],
  );
  if (result.rowCount !== 1) throw new Error('Username tidak ditemukan atau tidak unik.');
  await db.query('DELETE FROM insight_hub_private.sessions WHERE user_id=$1', [
    String(result.rows[0].id),
  ]);
  await db.query('COMMIT');
  console.log(
    'Password profil berhasil disimpan. Gunakan username dan password tersebut untuk login.',
  );
} catch (e) {
  if (!e.code) console.error(e.message);
  else reportError(e);
  process.exitCode = 1;
} finally {
  muted = false;
  rl.close();
  await db.end();
}
