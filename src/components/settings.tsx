'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Report } from '@/lib/types';
import { api } from './api';

export function Settings({ reports, categories }: { reports: Report[]; categories: Category[] }) {
  const blank = {
    id: '',
    title: '',
    categoryId: categories[0]?.id || '',
    description: '',
    embedUrl: '',
  };
  const router = useRouter(),
    titleInput = useRef<HTMLInputElement>(null),
    confirm = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(blank),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [target, setTarget] = useState<Report | null>(null);
  function reset() {
    setForm(blank);
    setError('');
    titleInput.current?.focus();
  }
  function edit(item: Report) {
    setForm({
      id: item.id,
      title: item.title,
      categoryId: item.category_id,
      description: item.description,
      embedUrl: item.embed_url,
    });
    setError('');
    setSuccess('');
    titleInput.current?.focus();
    titleInput.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api('/api/reports', 'POST', { ...form, id: form.id || undefined });
      setSuccess('Dashboard berhasil disimpan.');
      setForm(blank);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!target || busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api('/api/reports/' + encodeURIComponent(target.id), 'DELETE', {});
      setSuccess('Dashboard telah dihapus.');
      if (form.id === target.id) setForm(blank);
      confirm.current?.close();
      setTarget(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      confirm.current?.close();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container settings">
      <div className="section-heading">
        <h1>Manajemen Katalog Dashboard</h1>
        <button className="button secondary" onClick={reset} disabled={busy}>
          + Tambah Baru
        </button>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="notice success" role="status">
          {success}
        </div>
      )}
      {!categories.length && (
        <p className="notice" role="status">
          Belum ada kategori aktif yang diizinkan. Periksa grup akses akun di Supabase.
        </p>
      )}
      <div className="settings-grid">
        <section className="editor panel">
          <h2>{form.id ? 'Edit Dashboard' : 'Tambah Dashboard'}</h2>
          <form onSubmit={save} className="form-stack">
            <fieldset disabled={busy || !categories.length}>
              <label>
                Judul Dashboard <span>*</span>
                <input
                  ref={titleInput}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={160}
                  required
                />
              </label>
              <label>
                Kategori
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Deskripsi Ringkas
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={1000}
                  rows={3}
                />
              </label>
              <label>
                URL Embed Laporan <span>*</span>
                <input
                  type="url"
                  placeholder="https://app.powerbi.com/..."
                  value={form.embedUrl}
                  onChange={(e) => setForm({ ...form, embedUrl: e.target.value })}
                  maxLength={2048}
                  required
                />
              </label>
              <p className="field-hint">Gunakan URL embed Power BI yang diizinkan perusahaan.</p>
              <button className="button blue wide" disabled={busy}>
                {busy ? 'Memproses…' : 'Simpan Data'}
              </button>
              {form.id && (
                <button type="button" className="button secondary wide" onClick={reset}>
                  Batal Edit
                </button>
              )}
            </fieldset>
          </form>
        </section>
        <section className="panel table-panel" aria-label="Daftar laporan">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Dashboard</th>
                  <th>Kategori</th>
                  <th className="right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <small title={item.embed_url}>{item.embed_url}</small>
                    </td>
                    <td>
                      <span className="category-label">{item.category}</span>
                    </td>
                    <td className="actions">
                      <button className="text-button" onClick={() => edit(item)} disabled={busy}>
                        Edit
                      </button>
                      <button
                        className="text-button danger"
                        disabled={busy}
                        onClick={() => {
                          setTarget(item);
                          confirm.current?.showModal();
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {!reports.length && (
                  <tr>
                    <td colSpan={3} className="table-empty">
                      Belum ada dashboard. Tambahkan melalui form di samping.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <dialog
        ref={confirm}
        className="confirm-dialog"
        aria-labelledby="delete-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <h2 id="delete-title">Hapus dashboard?</h2>
        <p>
          “{target?.title}” akan dinonaktifkan dari katalog. Laporan asli di Power BI tetap
          tersedia.
        </p>
        <div className="dialog-actions">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => confirm.current?.close()}
          >
            Batal
          </button>
          <button className="button destructive" disabled={busy} onClick={remove}>
            {busy ? 'Menghapus…' : 'Hapus Dashboard'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
