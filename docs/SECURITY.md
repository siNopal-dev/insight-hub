# Model keamanan dan batas integrasi

## Perlindungan aplikasi yang sudah diterapkan

- Koneksi database hanya di modul server; tidak ada password/legacy token pada props client, JavaScript browser, localStorage, atau URL.
- Cookie berisi random 256-bit opaque ID. Database menyimpan SHA-256 ID; token lama terenkripsi AES-256-GCM. Kunci unik 32-byte melalui environment server.
- Session lama pada browser yang sama dicabut ketika login berhasil; logout mencabut row server. Cookie produksi Secure, HttpOnly, SameSite=Lax, path `/`, prefix `__Host-`.
- Masa session absolut 30 menit (konfigurasi dibatasi 5–120). Tidak ada auto-renew tanpa autentikasi ulang.
- Identitas/role yang diberikan browser tidak dipercaya. API membaca session dari database; mutasi memerlukan role `admin`.
- Semua mutasi memakai POST/DELETE, JSON dengan body maksimal 16 KiB, Origin exact match APP_ORIGIN, penolakan Sec-Fetch-Site cross-site. Tidak ada efek samping via GET.
- SQL parameterized; UUID acak `crypto.randomUUID`; validasi judul, kategori, deskripsi, ID, dan HTTPS URL host allowlist di server. Browser juga membatasi URL lama saat viewer dibuka.
- React meng-escape konten. Tidak memakai `innerHTML`, `dangerouslySetInnerHTML`, inline `onclick`, atau HTML dari database.
- CSP script nonce/strict-dynamic; frame-src dibatasi domain laporan; frame-ancestors none; nosniff; Referrer-Policy; HSTS produksi. Style inline diizinkan untuk kompatibilitas React/Next; script inline tanpa nonce tidak diizinkan.
- Rate limit tersimpan di PostgreSQL lintas instance: 8 percobaan/akun/15 menit, 1000 total/15 menit; opsional 40/IP/15 menit hanya jika reverse proxy tepercaya; mutasi 60/session/menit. Counter dibatasi secara atomik memakai UPSERT. Rate limit gagal tertutup jika database tidak tersedia. Sesuaikan batas global untuk ukuran organisasi.
- Data internal tidak dicache SW; header private/no-store; cache offline hanya halaman netral dan ikon/logo. Logout disebarkan antar-tab; halaman dari bfcache reload; validitas sesi diperiksa tiap menit ketika tab aktif.
- Respons database gagal generik. Log server hanya kode error, tidak SQL/username/password/token/full exception.
- Verifikasi sertifikat TLS aktif; tidak ada rejectUnauthorized=false.

## Hal yang harus diselesaikan pada database/deployment

1. Jalankan `db:setup` dan `db:secure`. Menyembunyikan UI saja tidak cukup bila fungsi `login_pengguna`/CRUD masih terbuka melalui anon Supabase API.
2. Baca `sql/003_security_inspection.sql`. Audit tabel pengguna/token legacy, fungsi SECURITY DEFINER, dynamic SQL, RLS/grants lain dan API lain yang tidak disertakan dalam folder project. Paket ini belum dapat mengaudit body fungsi database Anda. Cabut akses publik ke tabel password/token bila ada; lakukan berdasarkan schema aktual, bukan nama tabel tebakan.
3. Server awal dapat memakai koneksi CI4 untuk kompatibilitas. Produksi sebaiknya memakai role login khusus dengan privilege minimum: SELECT kolom reports yang dibutuhkan, EXECUTE hanya fungsi yang diperlukan, serta akses session/rate-limit private. Jika migration dijalankan oleh owner berbeda, role runtime memerlukan USAGE schema, SELECT/INSERT/DELETE sessions, SELECT/INSERT/UPDATE/DELETE rate_limits, dan policy RLS khusus role tersebut (atau ownership khusus schema private). Jangan memberi BYPASSRLS secara global hanya untuk mengatasi error. Fungsi legacy SECURITY INVOKER dapat memerlukan hak tambahan—audit definisinya sebelum mengurangi izin.
4. Jangan expose schema insight_hub_private di Supabase Data API. anon/authenticated tidak diberi grant/policy schema ini.
5. Akun dan role masih milik sistem login lama. Role dalam session Next.js adalah snapshot saat login, bukan query langsung ke tabel pengguna yang schemanya belum diketahui. Setelah menonaktifkan akun/mengubah role/reset password, **wajib cabut sesi Next.js**:

   ```bash
   npm run session:revoke -- USER_ID
   # Untuk rotasi kunci/insiden:
   npm run session:revoke -- --all
   ```

   Cabut token pada sistem legacy juga sesuai prosedur database Anda. Logout Next.js mencabut akses portal melalui session Next.js; ia tidak mengasumsikan adanya fungsi revoke token legacy yang belum tersedia.
6. Fungsi simpan/hapus lama harus memvalidasi role dan expiry token sendiri. Token sudah tidak bisa diperoleh browser melalui aplikasi baru, tetapi batas legacy tetap harus diaudit.
7. Jangan memakai Power BI **Publish to web** untuk data rahasia. Login portal tidak membuat URL report publik menjadi privat. Gunakan secure embed dengan autentikasi/izin Power BI yang sesuai. Paket mempertahankan iframe URL lama; tidak menciptakan embed token Power BI atau mengubah akses report Microsoft.
8. TRUST_PROXY_IP hanya true bila proxy menghapus header klien lalu menulis IP tepercaya. Default false; account/global limit tetap aktif.
9. APP_ORIGIN hanya domain produksi milik Anda. Jangan membangun allowlist Origin dari Host/X-Forwarded-Host pengguna.
10. Siapkan backup sebelum migrasi permission/crypt. Koordinasikan aplikasi lain yang memakai database yang sama. Tidak ada DROP/TRUNCATE tabel legacy dalam paket ini.

Kredensial asli project CI4 tidak disertakan di ZIP. SESSION_ENCRYPTION_KEY baru harus tetap stabil lintas instance/redeploy. Mengubahnya membutuhkan pencabutan semua sesi lama.
