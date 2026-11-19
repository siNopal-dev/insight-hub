import { randomUUID } from 'node:crypto';
import { requireSession, rateLimit } from '@/lib/auth';
import { transaction } from '@/lib/db';
import { reportSchema } from '@/lib/validation';
import { failure, HttpError, jsonBody, reply } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const raw = await jsonBody(request);
    const session = await requireSession(true);
    await rateLimit('write:' + session.sid, 60, 60);
    const data = reportSchema.parse(raw), id = data.id || randomUUID();
    await transaction(async db => {
      if (data.id) {
        const found = await db.query('SELECT id FROM public.reports WHERE id=$1 FOR UPDATE', [id]);
        if (!found.rowCount) throw new HttpError(404, 'Dashboard sudah tidak tersedia.');
      }
      await db.query('SELECT * FROM public.simpan_report($1,$2,$3,$4,$5,$6,$7)', [session.token, id, data.title, data.category, data.description, '📊', data.embedUrl]);
      const result = await db.query('SELECT title,category,description,embed_url FROM public.reports WHERE id=$1', [id]);
      const saved = result.rows[0];
      if (!saved || saved.title !== data.title || saved.category !== data.category || (saved.description || '') !== data.description || saved.embed_url !== data.embedUrl) throw new HttpError(409, 'Penyimpanan ditolak database. Silakan login ulang dan coba kembali.');
    });
    return reply({ ok: true, id }, data.id ? 200 : 201);
  } catch (e) { return failure(e); }
}
