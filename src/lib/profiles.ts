import 'server-only';
import { pool } from './db';
import type { User } from './types';
export async function getProfile(id: string): Promise<User | null> {
  const { rows } = await pool().query<User>(
    `
    SELECT p.id,p.username,p.full_name AS name,p.role,d.name AS department,
      p.access_group_id,g.name AS access_group,
      COALESCE(g.is_active AND g.all_categories,false) AS all_categories
    FROM public.profiles p
    LEFT JOIN public.departments d ON d.id=p.department_id
    LEFT JOIN public.access_groups g ON g.id=p.access_group_id
    WHERE p.id=$1 AND p.is_active AND p.role IN ('admin','user')`,
    [id],
  );
  return rows[0] || null;
}
