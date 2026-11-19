# Insight Hub — Next.js

Migrasi portal PT. Prima Fara Textile dari CodeIgniter 4 ke **Next.js App Router + React + TypeScript**, dengan database Supabase PostgreSQL yang sama. Warna navy, logo asli, font Manrope/DM Sans, susunan katalog, pencarian/kategori, modal Power BI, form/tabel admin dipertahankan. Font disajikan lokal; tidak membutuhkan Tailwind CDN/Google Fonts saat runtime.

## Mulai di Windows / macOS / Linux

Persyaratan: Node.js **22 LTS atau lebih baru**, npm, akses database Supabase, akun aplikasi lama yang valid. Ekstrak ZIP, buka terminal di folder `insight-hub-nextjs`.

```bash
npm ci
```

**Cara praktis menggunakan konfigurasi lama (tanpa mengetik ulang password database):**

```powershell
npm run config:import -- "F:\MagangHub\web\insight-hub\.env"
```

Ganti lokasi dengan `.env` project CI4 milik Anda. Skrip membaca file di komputer Anda, membuat `.env.local`, menghasilkan kunci enkripsi acak, tidak menampilkan rahasia, dan menolak menimpa `.env.local` yang sudah ada. Project lama tidak diubah.

Alternatif: salin `.env.example` menjadi `.env.local`, isi `DATABASE_URL`, lalu hasilkan kunci:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Simpan output sebagai `SESSION_ENCRYPTION_KEY`. Jangan kirim nilainya ke chat atau commit ke Git.

### Siapkan koneksi dan tabel keamanan

1. Ambil host/user/port dari tombol **Connect** di project Supabase yang sama. Untuk jaringan IPv4, gunakan **Session pooler** port 5432 atau Transaction pooler port 6543. Gunakan username persis dari Supabase, termasuk suffix project pada pooler. Jangan gunakan URL API HTTPS sebagai hostname PostgreSQL.
2. TLS diverifikasi. Jika koneksi memerlukan CA Supabase, unduh CA resmi dari pengaturan database lalu masukkan isi PEM ke `DATABASE_CA_CERT` (baris baru boleh ditulis sebagai `\n`). Jangan mematikan verifikasi TLS.
3. Jalankan:

```bash
npm run db:setup
npm run db:check
```

`db:setup` membuat schema **insight_hub_private** dengan dua tabel tambahan: `sessions` dan `rate_limits`. Tabel `public.reports`, akun, password, dan isi dashboard lama **tidak diganti**. Jalankan setup memakai role pemilik database. Role runtime harus memiliki akses ke schema private dan fungsi legacy; untuk konfigurasi awal koneksi yang sama dengan CI4 dapat digunakan hanya pada server. Lihat `docs/SECURITY.md` untuk pemisahan role produksi.

`db:check` hanya membaca metadata, tidak menjalankan login/CRUD. Pastikan hasilnya menemukan tabel/kolom dan tiga fungsi sesuai kontrak di bawah. Jika muncul error `crypt(text,text) does not exist` saat login, baca **Perbaikan login lama** di bawah.

### Tutup jalur Data API lama sebelum produksi

```bash
npm run db:secure
```

Perintah ini mencabut akses `PUBLIC`, `anon`, dan `authenticated` terhadap `public.reports` dan tiga fungsi legacy. Dengan begitu browser tidak dapat melewati login/rate limit Next.js melalui Supabase Data API. **Review bila Supabase yang sama dipakai aplikasi lain:** client lama yang menggunakan anon/authenticated langsung akan terdampak. CI4/Next.js dengan role PostgreSQL server yang berizin tetap bekerja. Isi tabel dan body fungsi tidak berubah. Audit permission lebih lanjut tersedia di `sql/003_security_inspection.sql`.

### Jalankan aplikasi

```bash
npm run dev
```

Buka **http://localhost:3000**. Login dengan akun yang sama seperti aplikasi CI4. Admin membuka `/setting`; user biasa hanya portal `/`. Tidak ada akun admin default atau kredensial demo.

`APP_ORIGIN` harus persis origin yang Anda buka. Contoh `http://localhost:3000` tidak sama dengan `http://127.0.0.1:3000`. Jika mengganti port, sesuaikan `.env.local` lalu restart.

## Fitur dan perubahan

| Fitur lama | Versi Next.js |
| --- | --- |
| Login username/password | Tetap memanggil `public.login_pengguna()` di server |
| Role admin/user | Guard server pada halaman dan setiap mutasi API |
| Katalog dashboard | Tabel `public.reports`, urutan `created_at ASC` |
| Pencarian + kategori | Bekerja bersamaan; kategori tidak hilang saat mengetik |
| Modal Power BI | Modal native, layar penuh, tab baru; iframe dilepas saat ditutup |
| Tambah/edit/hapus | Fungsi database lama tetap digunakan; input divalidasi; hasil write diverifikasi |
| Session PHP | Session opaque di cookie HttpOnly; hash session + token terenkripsi di server |
| PWA | Manifest benar, registrasi SW, prompt instalasi, notifikasi update, halaman offline aman |
| Aset | Logo/ikon lama, font lokal, ikon maskable tambahan |

## Kontrak database yang dipertahankan

Aplikasi sengaja memakai **koneksi PostgreSQL server-side**, seperti CI4. Ini bukan migrasi ke Supabase Auth dan tidak membuat project Supabase baru. Tidak perlu anon key/service-role key di frontend.

| Objek | Kontrak |
| --- | --- |
| `public.reports` | `id` UUID, `title`, `category`, `description`, `embed_url`, `created_at`, `updated_at`; fungsi simpan juga menerima `icon` |
| `public.login_pengguna(username, password)` | Mengembalikan row sukses: `id`, `username`, `role`, dan `session_token` atau `token`; `nama_lengkap` opsional. Gagal: tidak ada row atau exception. |
| `public.simpan_report(token, id, title, category, description, icon, embed_url)` | Menyimpan row dengan ID yang dikirim, menggunakan token admin dari fungsi login |
| `public.hapus_report(token, id)` | Menghapus row berdasarkan ID dan memvalidasi token admin |

Adapter ada di `src/app/api/auth/login/route.ts`, `src/app/api/reports/route.ts`, dan `src/app/api/reports/[id]/route.ts`. Parameter SQL terikat, bukan interpolasi input. Jika signature database berbeda, sesuaikan adapter setelah membaca `db:check`. File definisi SQL asli tidak terdapat dalam folder CI4; kompatibilitas hasil fungsi belum dapat diverifikasi langsung pada database aktif.

### Perbaikan login lama (`crypt()`)

Log CI4 yang diperiksa memuat `function crypt(text, text) does not exist`. Paket menyediakan `sql/002_optional_repair_crypt.sql`. Review dan jalankan melalui SQL Editor Supabase **hanya bila error tersebut masih muncul**. Skrip:

- memasang `pgcrypto` jika belum ada;
- menemukan schema extension yang sebenarnya;
- menetapkan search path fungsi `public.login_pengguna` dua argumen agar dapat menemukan `crypt()`;
- tidak mengganti body login, akun, atau hash password.

Jika ada overload atau fungsi menggunakan schema eksplisit yang keliru, skrip akan memerlukan penyesuaian berdasarkan definisi aslinya. Gunakan schema yang hanya dapat ditulis administrator tepercaya. Perubahan ini **belum dijalankan** pada Supabase Anda.

## PWA

Service worker aktif pada build **production**. Di `npm run dev` sengaja tidak didaftarkan agar cache tidak mengganggu pengembangan.

- `start_url: '/'`, scope `/`, standalone, ikon 192/512 dan maskable.
- Tombol “Pasang Aplikasi” muncul jika browser menyediakan `beforeinstallprompt`. Pada iOS gunakan Share → Add to Home Screen.
- Halaman offline menjelaskan bahwa laporan memerlukan internet; **dashboard, session, API, RSC, dan Power BI tidak di-cache**.
- Update ditawarkan sebelum reload; simpan form dahulu. Naikkan versi cache di `public/sw.js` ketika aset shell berubah.
- HTTPS diperlukan pada hosting produksi. Tidak ada push notification atau APK/TWA dalam paket ini. TWA kelak membutuhkan domain HTTPS, aplikasi Android, serta Digital Asset Links yang sesuai sertifikat aplikasi.

## Build dan deploy

```bash
npm test
npm run typecheck
npm run build
npm start
```

Untuk `npm start`, set `APP_ORIGIN=https://domain-anda` dan gunakan HTTPS melalui reverse proxy/platform. Cookie produksi memakai prefix `__Host-`, Secure, HttpOnly, SameSite=Lax. Build tidak memerlukan akses database; login/portal memerlukan database saat runtime.

Pilihan deployment:

- **Vercel / hosting Next.js Node**: import repository, pilih Next.js, set semua environment server pada platform, set APP_ORIGIN ke domain deployment; gunakan pooler Supabase yang sesuai serverless. Jangan memakai static export.
- **Server Node/Docker**: `docker build -t insight-hub .`, lalu injeksikan environment produksi saat menjalankan container. Mount/provide CA resmi bila diperlukan. Docker memakai standalone output dan user non-root. Letakkan reverse proxy HTTPS di depan container.

Jangan unggah `.env.local`, session lama CI4, debugbar, atau logs ke repository/hosting public. Karena `.env` lama dibagikan bersama project, lakukan rotasi password database melalui Supabase sebelum penggunaan produksi jika kredensial tersebut pernah terpapar pihak lain.

## Pengujian dan status

- Build production Next.js: **lolos**.
- TypeScript: **lolos**.
- 9 automated tests: **lolos** (validasi, Origin, keamanan URL, enkripsi, XSS escaping, kombinasi filter, kebijakan SW).
- Audit dependency produksi: **0 temuan** pada pemeriksaan 19 November 2026; bukan jaminan bebas celah.
- Browser: tampilan login, katalog, pencarian+filter, isi/reset form edit diperiksa dengan fixture sementara; fixture tidak disertakan dalam hasil akhir.
- Koneksi Supabase live: **belum terverifikasi**, percobaan baca metadata terhalang resolusi jaringan `EAI_AGAIN` pada lingkungan pengerjaan. Tidak ada migrasi/CRUD pada database Anda yang dijalankan.
- Instalasi PWA nyata, offline end-to-end, login akun sah, CRUD live, hak akses user/admin live, dan embed laporan Power BI asli perlu acceptance test setelah konfigurasi. Checklist lengkap: `docs/ACCEPTANCE.md`.

## Struktur

- `src/app/`: halaman, manifest, route API.
- `src/components/`: UI portal, pengaturan, login, modal, shell, PWA.
- `src/lib/`: koneksi PostgreSQL, session, validasi, crypto, kebijakan request.
- `src/proxy.ts`: nonce CSP dan header no-store.
- `public/`: aset asli, ikon maskable, offline shell, SW.
- `sql/`: session private, patch crypt opsional, pemeriksaan permission, hardening API.
- `scripts/`: import konfigurasi CI4, check/setup DB, hardening, revoke session.
- `tests/`: pengujian otomatis tanpa database produksi.

Rujukan implementasi: https://nextjs.org/docs/app/guides/progressive-web-apps ; https://nextjs.org/docs/app/guides/authentication ; https://supabase.com/docs/guides/database/connecting-to-postgres .
