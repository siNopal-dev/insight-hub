import { hashSession } from './crypto';
import type { User } from './types';
export type SessionRecord = User & {
  sid: string;
  password_hash: string | null;
  credential_tag: string | null;
};
export const sessionSelect = `SELECT s.sid,s.user_data->>'credential_tag' AS credential_tag,
 p.password_hash,p.id,p.username,p.full_name AS name,p.role,d.name AS department,
 p.access_group_id,g.name AS access_group,
 COALESCE(g.is_active AND g.all_categories,false) AS all_categories
 FROM insight_hub_private.sessions s
 JOIN public.profiles p ON p.id::text=s.user_id
 LEFT JOIN public.departments d ON d.id=p.department_id
 LEFT JOIN public.access_groups g ON g.id=p.access_group_id
 WHERE s.sid=$1 AND s.expires_at>now() AND s.user_data->>'auth_provider'='profiles'
 AND p.is_active AND p.role IN ('admin','user')`;
export function sessionUser(row: SessionRecord): User | null {
  if (!row.password_hash || hashSession(row.password_hash) !== row.credential_tag) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    department: row.department,
    access_group_id: row.access_group_id,
    access_group: row.access_group,
    all_categories: row.all_categories,
  };
}
