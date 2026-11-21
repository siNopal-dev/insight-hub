'use client';
import { useRef, useState } from 'react';
import { filterReports, validEmbedUrl } from '@/lib/validation';
import type { Report } from '@/lib/types';
export function Portal({ reports, embedHosts }: { reports: Report[]; embedHosts: string[] }) {
  const [category, setCategory] = useState('all'),
    [query, setQuery] = useState('');
  const [active, setActive] = useState<Report | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null),
    iframe = useRef<HTMLIFrameElement>(null);
  const opening = useRef(0);
  const shown = filterReports(reports, category, query);
  async function open(report: Report) {
    const requestId = ++opening.current;
    setError('');
    setActive(null);
    setLoading(true);
    dialog.current?.showModal();
    try {
      const response = await fetch('/api/reports/' + encodeURIComponent(report.id), {
        cache: 'no-store',
      });
      const result = await response.json();
      if (requestId !== opening.current) return;
      if (!response.ok) throw new Error(result.error || 'Laporan tidak dapat dibuka.');
      const current: Report = result.report;
      if (!validEmbedUrl(current.embed_url, embedHosts))
        throw new Error('URL laporan ini belum diizinkan. Hubungi admin.');
      setActive(current);
    } catch (e) {
      if (requestId !== opening.current) return;
      dialog.current?.close();
      setActive(null);
      setLoading(false);
      setError((e as Error).message);
    }
  }
  async function fullscreen() {
    try {
      if (!document.fullscreenElement) await iframe.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      setError('Layar penuh tidak tersedia. Gunakan pilihan Tab Baru.');
    }
  }
  function close() {
    opening.current++;
    setLoading(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    dialog.current?.close();
    setActive(null);
  }
  return (
    <div className="container portal">
      <section className="hero">
        <span className="eyebrow">Portal Eksekutif</span>
        <h1>Pusat Informasi &amp; Analytics</h1>
        <p>
          Akses dashboard PT. Prima Fara Textile sesuai kategori yang diizinkan untuk akun Anda.
        </p>
      </section>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <section className="filter-bar" aria-label="Cari dan filter dashboard">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            aria-label="Cari dashboard"
            placeholder="Cari dashboard..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="category-filters">
          {['all', ...new Set(reports.map((r) => r.category).filter(Boolean))].map((cat) => (
            <button
              key={cat}
              className={`chip ${category === cat ? 'selected' : ''}`}
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </section>
      <div className="results-info" role="status">
        {shown.length} dashboard{query || category !== 'all' ? ' ditemukan' : ' tersedia'}
      </div>
      <section className="report-grid" aria-label="Daftar dashboard">
        {shown.map((item) => (
          <article className="report-card" key={item.id}>
            <div className="card-category">
              <span className="category-label">{item.category}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.description || 'Tidak ada deskripsi.'}</p>
            <div className="card-bottom">
              <button onClick={() => open(item)} className="text-button">
                Buka Laporan{' '}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M7 7h10v10" />
                </svg>
              </button>
            </div>
          </article>
        ))}
        {shown.length === 0 && (
          <div className="empty">
            <span aria-hidden="true">▤</span>
            <h2>{reports.length ? 'Dashboard tidak ditemukan' : 'Belum ada dashboard'}</h2>
            <p>
              {reports.length
                ? 'Coba kata kunci atau kategori lainnya.'
                : 'Belum ada dashboard aktif untuk grup akses Anda. Hubungi admin untuk memeriksa akses kategori.'}
            </p>
            {(query || category !== 'all') && (
              <button
                className="button secondary"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
              >
                Reset pencarian
              </button>
            )}
          </div>
        )}
      </section>
      <dialog
        ref={dialog}
        className="viewer"
        aria-labelledby="viewer-title"
        onClose={() => {
          opening.current++;
          setActive(null);
          setLoading(false);
        }}
        onCancel={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="viewer-inner">
          <header className="viewer-header">
            <h2 id="viewer-title">{active?.title || 'Dashboard'}</h2>
            <div>
              <button className="nav-button" onClick={fullscreen}>
                ⛶ <span>Layar Penuh</span>
              </button>
              {active && (
                <a
                  href={active.embed_url}
                  className="nav-button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tab Baru ↗
                </a>
              )}
              <button className="close-button" aria-label="Tutup laporan" onClick={close}>
                ×
              </button>
            </div>
          </header>
          {loading && (
            <p className="viewer-loading" role="status">
              Memuat laporan Power BI…
            </p>
          )}
          {active && (
            <iframe
              ref={iframe}
              title={active.title}
              src={active.embed_url}
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
      </dialog>
    </div>
  );
}
