import 'server-only';
import { pool } from './db';
import { requireSession } from './auth';
import { categoryAccess, reportSelect } from './access';
import { HttpError } from './http';
import type { Category, Report } from './types';
function normalize(r: Report): Report {
  return {
    ...r,
    description: r.description || '',
    created_at: new Date(r.created_at).toISOString(),
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
  };
}
export async function listReports(): Promise<Report[]> {
  const { user } = await requireSession();
  const { rows } = await pool().query<Report>(
    `${reportSelect}
    ORDER BY c.sort_order,c.name,r.sort_order,r.created_at,r.id`,
    [user.id],
  );
  return rows.map(normalize);
}
export async function getReport(id: string): Promise<Report> {
  const { user } = await requireSession();
  const { rows } = await pool().query<Report>(`${reportSelect} AND r.id=$2`, [user.id, id]);
  if (!rows[0]) throw new HttpError(404, 'Dashboard tidak tersedia atau akses tidak diizinkan.');
  return normalize(rows[0]);
}
export async function listCategories(): Promise<Category[]> {
  const { user } = await requireSession();
  const { rows } = await pool().query<Category>(
    `SELECT c.id,c.name,c.slug
    FROM public.report_categories c WHERE c.is_active AND ${categoryAccess}
    ORDER BY c.sort_order,c.name,c.id`,
    [user.id],
  );
  return rows;
}
