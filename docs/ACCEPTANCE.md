# Uji penerimaan dengan database Anda

- Login username/password benar berhasil; salah/nonaktif/hash kosong ditolak.
- Username tidak peka huruf besar/kecil; password tetap peka.
- Password 5 dan 128 karakter dapat dibuat; 4 dan 129 ditolak.
- Reset password mencabut sesi lama. Logout lintas tab dan expiry bekerja.
- Tanpa sesi: halaman redirect login, API privat menolak 401.
- Produksi/Keuangan hanya melihat mapping masing-masing; all melihat kategori aktif.
- Admin grup terbatas tidak dapat membuka/mengedit/menghapus kategori lain.
- User all tidak boleh membuka pengaturan/mutasi.
- Nonaktifkan grup/hapus mapping: request baru menolak laporan terkait.
- Tambah/edit/hapus laporan uji berfungsi; hapus hanya is_active=false.
- Origin asing, URL HTTP/domain di luar allowlist, UUID salah ditolak.
- Power BI terbuka dengan izin Microsoft yang sesuai; fullscreen/Escape/tab baru bekerja.
- Tampilan desktop dan mobile sesuai; Tab menampilkan skip-link aksesibilitas.
- Offline hanya halaman netral; update PWA bekerja; banner instalasi tidak muncul.
- APP_ORIGIN produksi HTTPS benar; database TLS dan grants sesuai.

Pemeriksaan statis/build/fixture lokal tidak menggantikan uji koneksi dan izin produksi.
