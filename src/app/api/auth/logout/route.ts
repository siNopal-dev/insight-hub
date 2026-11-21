import { destroySession } from '@/lib/auth';
import { failure, jsonBody, reply } from '@/lib/http';
export async function POST(request: Request) {
  try {
    await jsonBody(request);
    await destroySession();
    return reply({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
