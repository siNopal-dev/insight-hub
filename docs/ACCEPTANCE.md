# Checklist acceptance sebelum mengganti CI4

Lakukan pada staging/backup database terlebih dahulu; jangan memakai laporan penting untuk uji hapus.

## Koneksi dan login

- [ ] config:import atau isi .env.local; gunakan Supabase project lama; CA resmi benar.
- [ ] db:setup sukses; db:check menemukan semua kolom/fungsi; db:secure direview dan dijalankan.
- [ ] login admin dan user biasa menggunakan akun lama berhasil; password salah ditolak; error DB tidak bocor.
- [ ] Bila crypt gagal: inspect pgcrypto + search_path; terapkan patch opsional yang sesuai.
- [ ] POST login dari Origin lain ditolak 403; Origin hilang juga ditolak.
- [ ] Username/password/token tidak muncul pada URL/localStorage/bundle.
- [ ] Rate limit menolak percobaan ke-9 pada akun uji dalam 15 menit; jangan lock akun penting.

## Hak akses dan CRUD

- [ ] Tanpa login, / dan /setting menuju /login.
- [ ] User biasa tidak melihat Pengaturan dan tidak bisa POST /api/reports / DELETE /api/reports/ID meskipun memanggil langsung (403).
- [ ] Tanpa cookie, API laporan menolak mutasi (401) dengan Origin yang sah.
- [ ] Admin buat laporan uji, edit, reload, dan pastikan row tersimpan di reports lama.
- [ ] Judul berisi apostrof dan teks `<script>` ditampilkan sebagai teks, tidak memecahkan tombol atau menjalankan kode.
- [ ] URL non-Power-BI/http/javascript ditolak; tambahkan host lain hanya di REPORT_EMBED_HOSTS bila tepercaya.
- [ ] Hapus laporan uji meminta konfirmasi; GET ke endpoint tidak menghapus; DELETE sah berhasil; kegagalan DB tidak menampilkan pesan sukses.
- [ ] Logout tab pertama membuat tab kedua keluar; ID cookie lama tidak lagi valid pada server.
- [ ] Setelah perubahan role/nonaktif akun, cabut session via CLI dan token legacy, kemudian pastikan akses ditolak.

## Tampilan dan laporan

- [ ] Bandingkan desktop dan layar 360/390/768 px: navy, logo, font, hero, kartu, form dan tabel sesuai; tabel boleh horizontal-scroll pada ponsel tanpa overflow seluruh halaman.
- [ ] Pencarian mempertahankan kategori terpilih; reset kembali semua.
- [ ] Buka laporan asli, close/Escape, fullscreen, tab baru; izin Power BI berlaku; iframe dihentikan saat ditutup.
- [ ] Keyboard: label input, focus jelas, dialog focus trap native, akses keluar dialog.

## PWA production HTTPS

- [ ] npm run build sukses, jalankan produksi di HTTPS dengan APP_ORIGIN yang sama.
- [ ] Manifest start_url=/, scope=/; semua ikon 192/512/maskable dapat diakses.
- [ ] DevTools Application: service worker aktif; install melalui Chrome atau Add to Home Screen iOS.
- [ ] Matikan koneksi lalu navigasikan: hanya halaman offline generik, tidak ada laporan tersimpan.
- [ ] Cache Storage hanya ih-public-v1 dan aset publik; tidak ada login, reports, API, RSC atau response HTML berisi user.
- [ ] Nyalakan koneksi, coba kembali; login dan laporan normal.
- [ ] Ubah versi cache, deploy update, muncul tawaran update; simpan form sebelum refresh.
- [ ] Cookie produksi HttpOnly/Secure/SameSite; CSP/nosniff/no-store aktif.

## Deploy dan rollback

- [ ] Backup database dan project lama, konfigurasi HTTPS/secret/platform benar.
- [ ] Tidak ada .env asli, node_modules, .next, debugbar/session CI4 dalam repository publik.
- [ ] Jangan aktifkan akses user produksi sebelum acceptance login/CRUD/security lulus.
- [ ] Rollback app: arahkan hosting ke CI4 lama bila diperlukan. Tabel reports tetap sama. Schema private tambahan boleh tetap ada.
- [ ] Rollback grant SQL hanya berdasarkan backup grant sebelum hardening; jangan asal GRANT ALL ke PUBLIC.
