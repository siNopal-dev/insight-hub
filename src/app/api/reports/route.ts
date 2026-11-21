import { rateLimit } from '@/lib/rate-limit';
import { randomUUID } from 'node:crypto';
import { requireSession } from '@/lib/auth';
import { transaction } from '@/lib/db';
import { reportSchema } from '@/lib/validation';
import { categoryAccess, adminAccess, reportSelect } from '@/lib/access';
import { listReports } from '@/lib/reports';
import { failure, HttpError, jsonBody, reply } from '@/lib/http';
export const runtime = 'nodejs';
export async function GET() {
  try {
    return reply({ reports: await listReports() });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const raw = await jsonBody(request);
    const session = await requireSession(true);
    await rateLimit('write:' + session.sid, 60, 60);
    const data = reportSchema.parse(raw),
      id = data.id || randomUUID();
    await transaction(async (db) => {
      // Authorize the current report AND destination category, preventing category reassignment bypass.
      if (data.id) {
        const found = await db.query(
          `${reportSelect} AND r.id=$2 AND ${adminAccess} FOR UPDATE OF r`,
          [session.user.id, id],
        );
        if (!found.rowCount)
          throw new HttpError(404, 'Dashboard tidak tersedia atau akses tidak diizinkan.');
      }
      const category = await db.query(
        `SELECT c.id FROM public.report_categories c
        WHERE c.id=$2 AND c.is_active AND ${categoryAccess} AND ${adminAccess} FOR SHARE OF c`,
        [session.user.id, data.categoryId],
      );
      if (!category.rowCount)
        throw new HttpError(403, 'Kategori tidak aktif atau tidak diizinkan untuk akun ini.');
      if (data.id) {
        await db.query(
          `UPDATE public.reports SET title=$2,category_id=$3,description=$4,
          embed_url=$5,updated_by=$6,updated_at=now() WHERE id=$1`,
          [id, data.title, data.categoryId, data.description, data.embedUrl, session.user.id],
        );
      } else {
        // UUID suffix ensures unique slugs even when titles are identical.
        const slug =
          (data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60) || 'dashboard') +
          '-' +
          id;
        await db.query(
          `INSERT INTO public.reports
          (id,category_id,title,slug,description,provider,embed_url,icon,sort_order,is_active,created_by,updated_by,created_at,updated_at)
          VALUES($1,$2,$3,$4,$5,'powerbi',$6,'📊',0,true,$7,$7,now(),now())`,
          [id, data.categoryId, data.title, slug, data.description, data.embedUrl, session.user.id],
        );
      }
    });
    return reply({ ok: true, id }, data.id ? 200 : 201);
  } catch (e) {
    return failure(e);
  }
}
