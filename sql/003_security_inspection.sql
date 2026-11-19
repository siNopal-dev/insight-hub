-- READ ONLY: inspect before changing permissions on shared/legacy objects.
SELECT p.oid::regprocedure AS function_signature, p.prosecdef AS security_definer,
       p.proconfig AS function_settings,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('login_pengguna','simpan_report','hapus_report');
SELECT grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='reports';
SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='public.reports'::regclass;
SELECT schemaname,tablename,policyname,roles,cmd FROM pg_policies WHERE schemaname='public' AND tablename='reports';
SELECT has_schema_privilege('anon','public','CREATE') AS anon_can_create, has_schema_privilege('authenticated','public','CREATE') AS authenticated_can_create;
