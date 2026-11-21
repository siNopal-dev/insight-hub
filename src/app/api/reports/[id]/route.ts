import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { transaction } from '@/lib/db';
import { reportSelect, adminAccess } from '@/lib/access';
import { getReport } from '@/lib/reports';
import { failure, HttpError, jsonBody, reply } from '@/lib/http';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    return reply({ report: await getReport(z.uuid().parse((await context.params).id)) });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    await jsonBody(request);
    const session = await requireSession(true);
    await rateLimit('write:' + session.sid, 60, 60);
    const id = z.uuid().parse((await context.params).id);
    await transaction(async (db) => {
      const found = await db.query(
        `${reportSelect} AND r.id=$2 AND ${adminAccess} FOR UPDATE OF r`,
        [session.user.id, id],
      );
      if (!found.rowCount)
        throw new HttpError(404, 'Dashboard tidak tersedia atau akses tidak diizinkan.');
      // Archive rather than breaking favorites or audit relationships.
      await db.query(
        'UPDATE public.reports SET is_active=false,updated_by=$2,updated_at=now() WHERE id=$1',
        [id, session.user.id],
      );
    });
    return reply({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
