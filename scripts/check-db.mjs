import { database, reportError } from './db.mjs';
const db = database();
try {
  await db.connect(); await db.query('BEGIN READ ONLY');
  const cols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='reports'");
  const required = ['id','title','category','description','embed_url','created_at','updated_at'];
  const missing = required.filter(k => !cols.rows.some(r => r.column_name===k));
  console.log('Kolom public.reports:', missing.length ? 'KURANG: '+missing.join(', ') : 'OK');
  const fns = await db.query("SELECT p.proname,p.pronargs,pg_get_function_result(p.oid) AS result,p.proconfig FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname=ANY($1)", [['login_pengguna','simpan_report','hapus_report']]);
  console.log('Kontrak fungsi (tanpa menjalankan login/CRUD):', JSON.stringify(fns.rows,null,2));
  const expected = [['login_pengguna',2],['simpan_report',7],['hapus_report',2]];
  const missingFunctions = expected.filter(([name,n]) => !fns.rows.some(r=>r.proname===name && r.pronargs===n));
  const crypto = await db.query("SELECT n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto'");
  console.log('pgcrypto:',crypto.rows[0]?.schema || 'BELUM TERPASANG');
  const privateTables = await db.query("SELECT to_regclass('insight_hub_private.sessions')::text AS sessions, to_regclass('insight_hub_private.rate_limits')::text AS rate_limits");
  console.log('Tabel keamanan:',privateTables.rows[0]);
  if (missing.length || missingFunctions.length || !privateTables.rows[0].sessions || !privateTables.rows[0].rate_limits) process.exitCode=1;
  await db.query('ROLLBACK');
  console.log('Selesai. Tidak ada data yang diubah. Bentuk hasil login tetap perlu diuji dengan akun sah.');
} catch(e) { reportError(e); } finally { await db.end(); }
