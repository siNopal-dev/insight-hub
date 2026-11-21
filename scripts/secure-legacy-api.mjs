import fs from 'node:fs/promises';
import { database, reportError } from './db.mjs';
const db = database();
try {
  await db.connect();
  await db.query(
    await fs.readFile(new URL('../sql/004_lock_legacy_api.sql', import.meta.url), 'utf8'),
  );
  console.log(
    'Akses anon/authenticated ke tabel portal dan fungsi legacy yang dikenal ditutup. Periksa aplikasi lain jika menggunakan Data API yang sama.',
  );
} catch (e) {
  reportError(e);
} finally {
  await db.end();
}
