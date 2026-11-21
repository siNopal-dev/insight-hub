# Hasil verifikasi 21 November 2026

- npm ci: berhasil; lockfile disertakan.
- npm run typecheck: lulus.
- npm test: 20 tes lulus, 0 gagal.
- npm run build: build produksi Next.js 16.4.6 lulus.
- HTTP lokal build produksi: /login 200, /api/auth/session 401 tanpa sesi,
  /api/reports 401 tanpa sesi, /manifest.webmanifest 200, /offline.html 200,
  /icon-192.png 200.
- SQL otorisasi/sesi dan migrasi diuji dengan PostgreSQL PGlite fixture, bukan database produksi.
- Tidak mengakses kredensial .env.local atau mengubah database pengguna.
- Login akun nyata, CRUD terhadap Supabase, tampilan browser, izin Power BI dan instalasi PWA
  di perangkat pengguna belum diuji; ikuti ACCEPTANCE.md sebelum deploy.

Lingkungan pengujian memerlukan hostname eksplisit 127.0.0.1 untuk server lokal.
Next menghasilkan ulang next-env.d.ts saat build. ZIP berisi deklarasi awal yang tidak
bergantung pada direktori .next sehingga pemeriksaan tipe bisa dijalankan setelah npm ci.
