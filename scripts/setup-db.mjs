import fs from 'node:fs/promises';
import { database, reportError } from './db.mjs';
const db=database();
try { await db.connect(); await db.query(await fs.readFile(new URL('../sql/001_private_sessions.sql',import.meta.url),'utf8')); console.log('Schema session dan rate limit siap. Tabel serta fungsi lama tidak diubah.'); }
catch(e) { reportError(e); } finally { await db.end(); }
