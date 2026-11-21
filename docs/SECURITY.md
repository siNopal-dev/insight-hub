# Keamanan

Login profiles memakai scrypt dengan salt acak dan perbandingan timingSafeEqual. Password baru 5–128 karakter sesuai kebutuhan pemilik. Password plaintext tidak disimpan. Query memakai parameter, validasi Zod, dan koneksi database hanya server dengan TLS tervalidasi.

Cookie sesi opaque HttpOnly/Secure produksi/SameSite=Lax. SHA-256 ID disimpan di schema privat. Query sesi memeriksa expiry, provider profiles, profil aktif dan role; fingerprint hash password membatalkan sesi setelah reset. Kolom encrypted_token legacy kosong. Tidak ada refresh token atau verifikasi Supabase Auth.

Query otorisasi kategori selalu menggunakan data database aktif. Admin tetap memerlukan izin kategori. Cache React hanya dalam render, tidak lintas request. Data yang sudah dikirim dan iframe terbuka tidak dapat ditarik kembali secara retroaktif.

Mutasi memerlukan Origin yang cocok, JSON terbatas 16 KiB, validasi UUID/URL, rate limit, dan izin server. URL embed wajib HTTPS dengan host allowlist. CSP, no-store dan header keamanan tetap aktif. Service worker hanya menyimpan aset publik.

DATABASE_URL dan SESSION_ENCRYPTION_KEY tidak boleh masuk Git. Gunakan izin database minimum yang sesuai query; jangan menganggap RLS otomatis membatasi koneksi owner. Skrip 004 menutup akses Data API tujuh tabel serta RPC legacy yang diketahui, bukan audit seluruh fungsi/izin. Skrip 005 juga mencabut izin per-kolom profiles. Periksa RPC dan grants pada database aktif secara terpisah.

Power BI Publish to web tetap publik bagi pemilik URL. Untuk laporan rahasia gunakan pengaturan izin Power BI yang sesuai. Portal tidak menerbitkan embed token Microsoft.
