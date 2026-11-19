import 'server-only';
import { pool } from './db';
import { requireSession } from './auth';
import type { Report } from './types';
export async function listReports(): Promise<Report[]> {
  await requireSession();
  const result = await pool().query('SELECT id,title,category,description,embed_url,created_at,updated_at FROM public.reports ORDER BY created_at ASC,id ASC');
  return result.rows.map(r => ({ id: String(r.id), title: String(r.title || ''), category: String(r.category || 'Lainnya'), description: String(r.description || ''), embed_url: String(r.embed_url || ''), created_at: new Date(r.created_at).toISOString(), updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null }));
}
