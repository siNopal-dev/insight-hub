import { requireSession } from '@/lib/auth';
import { failure, reply } from '@/lib/http';
export async function GET() { try { await requireSession(); return reply({ ok: true }); } catch(e) { return failure(e); } }
