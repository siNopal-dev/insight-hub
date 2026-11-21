-- Hardening jalur langsung Supabase Data API. Tidak mengubah data/body fungsi.
-- Setelah ini frontend lama berbasis anon/authenticated tidak bisa memanggil
-- fungsi lama atau membaca/mengubah tabel portal langsung. Backend CI4/Next memakai
-- koneksi PostgreSQL server terotorisasi tetap dapat bekerja.
-- Wajib review bila database dipakai aplikasi lain.
BEGIN;
REVOKE ALL ON TABLE public.profiles, public.departments, public.access_groups,
  public.access_group_categories, public.report_categories, public.reports,
  public.user_favorites FROM PUBLIC, anon, authenticated;
DO $block$
DECLARE fn regprocedure;
BEGIN
  FOR fn IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('login_pengguna','simpan_report','hapus_report')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $block$;
COMMIT;
