# Insight Hub — portal dashboard internal

Next.js App Router + React + TypeScript; PostgreSQL Supabase diakses melalui `pg` hanya di server. Login memakai `profiles.username` dan `profiles.password_hash` (scrypt), bukan Supabase Auth. Password baru 5–128 karakter.

## Memasang pembaruan

Baca `README_PEMASANGAN.txt`. Pertahankan `.env.local` milik Anda. ZIP tidak memuat rahasia, node_modules, atau .next. Jangan menghapus/membuat ulang tabel atau profil untuk memasang pembaruan ini.

Node.js 22 atau lebih baru:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

`npm run format` merapikan kode; `npm run format:check` memeriksa konsistensi format.

## Konfigurasi

Salin `.env.example` menjadi `.env.local` hanya untuk instalasi baru. Isi DATABASE_URL, APP_ORIGIN, SESSION_ENCRYPTION_KEY. Produksi wajib APP_ORIGIN HTTPS sesuai domain pengguna. DATABASE_CA_CERT opsional untuk CA khusus; validasi TLS selalu aktif. REPORT_EMBED_HOSTS berisi daftar host HTTPS yang diperbolehkan. TRUST_PROXY_IP hanya true bila proxy tepercaya mengganti header IP.

Nama SESSION_ENCRYPTION_KEY dipertahankan agar konfigurasi lama kompatibel. Kunci base64 32 byte ini digunakan untuk HMAC pembatas percobaan, bukan untuk menyimpan password. Buat kunci untuk instalasi baru dengan `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY tidak dibutuhkan oleh login versi ini. Jangan menghapus variabel yang digunakan aplikasi lain.

## Database dan akun

Tabel public: profiles, departments, access_groups, access_group_categories, report_categories, reports, user_favorites. Schema privat insight_hub_private berisi sessions dan rate_limits.

Paket ini pembaruan project/database yang sudah ada, bukan pembuat tujuh tabel public dari nol. `npm run db:check` memeriksa skema secara read-only. `npm run db:setup` membuat tabel privat jika belum ada. `sql/005_profiles_password_login.sql` adalah migrasi login profiles yang sudah dipakai project; tidak perlu dijalankan ulang jika sudah terpasang. Jangan jalankan script SQL otomatis pada database produksi tanpa memeriksa kondisi dan backup.

Untuk mengatur password akun yang sudah ada:

```sh
npm run password:set
```

Masukkan username, password 5–128 karakter, lalu konfirmasi. Script menyimpan hash dan mencabut sesi akun. Hash bukan password plaintext dan tidak boleh diketik sembarang di Table Editor. Profil nonaktif atau hash kosong tidak dapat login. Username unik tanpa membedakan besar/kecil huruf.

## Otorisasi

Role admin mengizinkan pengelolaan laporan; user hanya melihat. Keduanya perlu grup aktif dan kategori aktif. all_categories=true memberi semua kategori aktif; selain itu digunakan access_group_categories. Grup kosong/nonaktif tidak memberi akses laporan. Department adalah metadata; departments.is_active tidak memblokir login.

Daftar/detail/ubah/hapus memeriksa izin di server. Edit memeriksa kategori lama dan baru. Hapus menonaktifkan laporan, bukan menghapus laporan Power BI. Slug dipertahankan saat edit. created_by/updated_by bukan log audit lengkap. user_favorites disiapkan dalam database tetapi belum ada UI favorit.

## Sesi dan performa

Cookie opaque HttpOnly, Secure produksi, SameSite=Lax; server menyimpan hash ID sesi. Sesi diperiksa bersama profil dalam satu query. React cache hanya menghindari pengulangan selama render server yang sama; tidak ada cache otorisasi global. Route handler selalu membaca data terbaru.

Password hash berubah, profil nonaktif, role tidak valid, sesi dicabut atau kedaluwarsa menyebabkan sesi ditolak. Role/grup terbaru digunakan pada request berikutnya. Sesi berlaku 14 hari sejak login pada perangkat tersebut (absolut, tanpa silent refresh); sesi lama tetap mengikuti masa berlaku saat dibuat. `npm run session:revoke -- USER_ID` atau `--all` mencabut sesi. encrypted_token dipertahankan kosong untuk kompatibilitas tabel lama; utilitas seal/unseal tetap tersedia sebagai utilitas legacy, tidak dipakai login.

## PWA

Manifest dan service worker tetap aktif dalam produksi. Banner pemasangan disembunyikan; pemberitahuan offline/update tetap ada. Cache hanya aset publik dan offline.html, bukan halaman akun/API/laporan. Power BI memerlukan internet. Portal tidak membuat URL Power BI publik menjadi privat.

Logo navbar memakai `public/logo-pft.png` dan ditampilkan sebagai lingkaran. Ikon aplikasi Android memakai `public/icon-192.png` dan `public/icon-512.png` sesuai `src/app/manifest.ts`. Ikon maskable hanya boleh didaftarkan bila berkasnya ada dan logonya berada di area aman agar tidak terpotong launcher Android. Setelah mengganti aset publik, naikkan versi `CACHE` di `public/sw.js` agar service worker tidak terus menyajikan gambar lama. Jika ikon Android masih lama, hapus aplikasi terpasang lalu instal ulang dari Chrome.

## Struktur

- src/app: halaman dan route API.
- src/components: komponen UI.
- src/lib: autentikasi, query sesi, rate limit, akses, validasi, database.
- public: ikon, logo, offline.html, service worker.
- scripts dan sql: administrasi database; tidak dijalankan otomatis saat build.
- tests: regresi password, sesi, akses, migrasi, validasi, PWA, render.
- docs: keamanan, penerimaan, perubahan, hasil verifikasi.

Lihat docs/ACCEPTANCE.md untuk pengujian dengan akun dan database Anda. Pengujian fixture lokal tidak membuktikan konfigurasi database produksi benar.
