'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <h1>Portal belum dapat dimuat</h1>
      <p>
        Periksa koneksi internet atau hubungi administrator. Detail teknis tidak ditampilkan untuk
        melindungi data Anda.
      </p>
      <button className="button primary" onClick={reset}>
        Coba lagi
      </button>
      <a className="button secondary" href="/login">
        Ke halaman login
      </a>
    </main>
  );
}
