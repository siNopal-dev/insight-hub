import { database, reportError } from './db.mjs';
const id=process.argv[2];
if (!id) { console.error('Pemakaian: npm run session:revoke -- USER_ID | --all'); process.exit(1); }
const db=database();
try { await db.connect(); const r=id==='--all' ? await db.query('DELETE FROM insight_hub_private.sessions') : await db.query('DELETE FROM insight_hub_private.sessions WHERE user_id=$1',[id]); console.log(`${r.rowCount} sesi Next.js dicabut.`); }
catch(e) { reportError(e); } finally { await db.end(); }
