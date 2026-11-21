-- Jalankan sebagai pemilik database melalui Supabase SQL Editor.
-- Transaksi akan batal bila username duplikat atau tipe id tidak sesuai.
BEGIN;
DO $$ BEGIN
 IF (SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='id') IS DISTINCT FROM 'uuid' THEN
 RAISE EXCEPTION 'Migrasi memerlukan profiles.id bertipe uuid'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE username IS NULL OR btrim(username)='' OR username<>btrim(username)) THEN
 RAISE EXCEPTION 'Rapikan username kosong/spasi sebelum migrasi'; END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS ih_profiles_username_ci ON public.profiles(lower(username));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;
-- Lepas hanya FK keluar profiles menuju auth.users; ID dan relasi laporan tetap utuh.
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname FROM pg_constraint WHERE contype='f'
 AND conrelid='public.profiles'::regclass AND confrelid=to_regclass('auth.users') LOOP
 EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I',c.conname);
 END LOOP;
END $$;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
-- Blokir pembacaan hash melalui Data API, termasuk grants per kolom.
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT attname FROM pg_attribute WHERE attrelid='public.profiles'::regclass AND attnum>0 AND NOT attisdropped LOOP
 EXECUTE format('REVOKE SELECT (%I), INSERT (%I), UPDATE (%I), REFERENCES (%I) ON public.profiles FROM PUBLIC, anon, authenticated',c.attname,c.attname,c.attname,c.attname);
 END LOOP;
END $$;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.profiles.password_hash IS 'Server-only scrypt hash. NULL means password login is not initialized.';
COMMIT;
