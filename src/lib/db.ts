import 'server-only';
import pg, { type PoolClient } from 'pg';
const globalDb = globalThis as unknown as { ihPool?: pg.Pool };
export function pool() {
  if (!process.env.DATABASE_URL) throw new Error('Database is not configured');
  if (!globalDb.ihPool) {
    const url = new URL(process.env.DATABASE_URL);
    // pg connection-string sslmode can override ssl options: reject ambiguity.
    for (const k of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(k);
    globalDb.ihPool = new pg.Pool({ connectionString: url.toString(),
      ssl: { rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n') } : {}) },
      max: 5, connectionTimeoutMillis: 8000, idleTimeoutMillis: 30000, statement_timeout: 10000,
    });
    globalDb.ihPool.on('error', () => console.error('Database pool connection failed'));
  }
  return globalDb.ihPool;
}
export async function transaction<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool().connect();
  try { await db.query('BEGIN'); const result = await fn(db); await db.query('COMMIT'); return result; }
  catch (e) { await db.query('ROLLBACK'); throw e; }
  finally { db.release(); }
}
