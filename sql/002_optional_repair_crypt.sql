-- OPSIONAL: hanya jika db:check mendeteksi crypt() tidak tersedia untuk login lama.
-- Review terlebih dahulu. Perubahan: instal pgcrypto jika belum ada, dan tetapkan
-- search_path fungsi login_pengguna dua argumen. Tidak mengganti body/hash/password.
-- Jalankan sebagai pemilik fungsi. Schema public/extensions harus hanya writable
-- oleh administrator tepercaya. pg_temp ditempatkan terakhir.
BEGIN;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
DO $block$
DECLARE crypto_schema text; fn regprocedure; count_functions integer;
BEGIN
  SELECT n.nspname INTO crypto_schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto';
  SELECT count(*) INTO count_functions FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='login_pengguna' AND p.pronargs=2;
  IF count_functions <> 1 THEN RAISE EXCEPTION 'Expected one public.login_pengguna function with two arguments; inspect overloads manually'; END IF;
  SELECT p.oid::regprocedure INTO fn FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='login_pengguna' AND p.pronargs=2;
  EXECUTE format('ALTER FUNCTION %s SET search_path TO pg_catalog, public, %I, pg_temp', fn, crypto_schema);
END $block$;
COMMIT;
