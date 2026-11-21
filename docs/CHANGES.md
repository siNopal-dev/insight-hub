# Perubahan 21 November 2026

- Password tetap 5–128; perbaikan teks script dan tes batas; perintah npm password:set.
- Query sesi/profil digabung satu query. React cache selama render server saja.
- Hash password tidak dikembalikan oleh hasil getSession.
- Rate limit dipisahkan ke src/lib/rate-limit.ts.
- Tes regresi query sesi: expiry, provider legacy, profil nonaktif, perubahan role/password.
- Kode banner instalasi yang tidak terjangkau dibuang; offline dan update tetap tersedia.
- Dokumentasi dan env example sesuai login profiles; tidak membutuhkan Auth API keys.
- Deklarasi Next awal tidak mengharuskan file build dev yang belum ada.
- Prettier dan perintah format/format:check; format source lebih mudah diperiksa.
- Tidak mengubah database aktif, desain, role/grup, atau kredensial.

Skema legacy/SQL arsip dipertahankan untuk kompatibilitas, bukan migrasi wajib baru.
