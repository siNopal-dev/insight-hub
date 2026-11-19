import { z } from 'zod';
import { categories } from './types';
export function allowedEmbedHosts(value = process.env.REPORT_EMBED_HOSTS || 'app.powerbi.com') {
  return value.split(',').map(x => x.trim().toLowerCase()).filter(x => /^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,}$/.test(x));
}
export function validEmbedUrl(value: string, hosts = allowedEmbedHosts()) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && hosts.includes(u.hostname.toLowerCase());
  } catch { return false; }
}
export const loginSchema = z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(256) }).strict();
export const reportSchema = z.object({
  id: z.uuid().optional(), title: z.string().trim().min(1, 'Judul wajib diisi.').max(160),
  category: z.enum(categories), description: z.string().trim().max(1000),
  embedUrl: z.string().trim().max(2048).refine(v => validEmbedUrl(v), 'Gunakan URL HTTPS dari domain Power BI yang diizinkan.'),
}).strict();
export function filterReports<T extends { title: string; category: string; description: string }>(reports: T[], category: string, keyword: string) {
  const query = keyword.trim().toLocaleLowerCase('id');
  return reports.filter(r => (category === 'all' || category === r.category) && `${r.title} ${r.description || ''}`.toLocaleLowerCase('id').includes(query));
}
