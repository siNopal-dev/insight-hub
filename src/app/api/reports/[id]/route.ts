import { z } from 'zod';
import { requireSession, rateLimit } from '@/lib/auth';
import { transaction } from '@/lib/db';
import { failure, HttpError, jsonBody, reply } from '@/lib/http';
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await jsonBody(request);
    const session = await requireSession(true);
    await rateLimit('write:' + session.sid, 60, 60);
    const id = z.uuid().parse((await context.params).id);
    await transaction(async db => {
      const found = await db.query('SELECT id FROM public.reports WHERE id=$1 FOR UPDATE', [id]);
      if (!found.rowCount) throw new HttpError(404, 'Dashboard sudah dihapus.');
      await db.query('SELECT * FROM public.hapus_report($1,$2)', [session.token, id]);
      const remains = await db.query('SELECT id FROM public.reports WHERE id=$1', [id]);
      if (remains.rowCount) throw new HttpError(409, 'Penghapusan ditolak database. Silakan login ulang.');
    });
    return reply({ ok: true });
  } catch (e) { return failure(e); }
}
