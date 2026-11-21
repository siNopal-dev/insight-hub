import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { sameOrigin } from './request-policy';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function trustedOrigin(origin: string | null) {
  const configured = process.env.APP_ORIGIN;
  if (!configured) throw new Error('APP_ORIGIN is required');
  return sameOrigin(origin, configured, process.env.NODE_ENV === 'production');
}
export async function jsonBody(request: Request): Promise<unknown> {
  if (!trustedOrigin(request.headers.get('origin')))
    throw new HttpError(403, 'Permintaan tidak diizinkan. Muat ulang halaman.');
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    throw new HttpError(403, 'Permintaan lintas situs ditolak.');
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    throw new HttpError(415, 'Format permintaan tidak didukung.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Data kosong.');
  let bytes = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.length;
    if (bytes > 16384) {
      await reader.cancel();
      throw new HttpError(413, 'Data terlalu besar.');
    }
    parts.push(chunk.value);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Data tidak valid.');
  }
}
export function reply(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  });
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return reply({ error: error.message }, error.status);
  if (error instanceof ZodError)
    return reply({ error: error.issues[0]?.message || 'Periksa data yang diisi.' }, 400);
  // Never log SQL, passwords, tokens, URLs, or raw database exception messages.
  console.error('Request failed', {
    code: typeof error === 'object' && error && 'code' in error ? String(error.code) : 'INTERNAL',
  });
  return reply(
    { error: 'Layanan belum dapat memproses permintaan. Hubungi administrator atau coba kembali.' },
    503,
  );
}
