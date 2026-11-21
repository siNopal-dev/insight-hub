'use client';
export async function api(path: string, method: string, data: unknown) {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
      credentials: 'same-origin',
    });
  } catch {
    throw new Error('Koneksi terputus. Periksa internet Anda lalu coba kembali.');
  }
  const payload = await response.json().catch(() => ({ error: 'Terjadi gangguan layanan.' }));
  if (response.status === 401 && path !== '/api/auth/login') {
    window.location.replace('/login');
    throw new Error('Sesi berakhir.');
  }
  if (!response.ok) throw new Error(payload.error || 'Permintaan gagal.');
  return payload;
}
