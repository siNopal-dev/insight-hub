import { database, reportError } from './db.mjs';
const db = database();
const expected = {
  profiles: [
    'password_hash',
    'id',
    'username',
    'full_name',
    'department_id',
    'role',
    'access_group_id',
    'is_active',
    'created_at',
    'updated_at',
  ],
  departments: ['id', 'name', 'is_active'],
  access_groups: ['id', 'code', 'name', 'all_categories', 'is_active'],
  access_group_categories: ['access_group_id', 'category_id'],
  report_categories: ['id', 'name', 'slug', 'sort_order', 'is_active'],
  reports: [
    'id',
    'category_id',
    'title',
    'slug',
    'description',
    'provider',
    'embed_url',
    'icon',
    'sort_order',
    'is_active',
    'created_by',
    'updated_by',
    'created_at',
    'updated_at',
  ],
  user_favorites: ['user_id', 'report_id'],
};
try {
  await db.connect();
  await db.query('BEGIN READ ONLY');
  const { rows: columns } = await db.query(
    "SELECT table_name,column_name,data_type,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1)",
    [Object.keys(expected)],
  );
  for (const [table, fields] of Object.entries(expected)) {
    const missing = fields.filter(
      (f) => !columns.some((c) => c.table_name === table && c.column_name === f),
    );
    console.log(table, missing.length ? 'KURANG: ' + missing.join(', ') : 'OK');
    if (missing.length) process.exitCode = 1;
  }
  const privateTables = await db.query(
    "SELECT to_regclass('insight_hub_private.sessions') AS sessions,to_regclass('insight_hub_private.rate_limits') AS rate_limits",
  );
  console.log('Tabel sesi:', privateTables.rows[0]);
  if (!privateTables.rows[0].sessions || !privateTables.rows[0].rate_limits) process.exitCode = 1;
  // Verify profile credentials are accessible to the server without printing accounts.
  await db.query('SELECT id,password_hash FROM public.profiles LIMIT 0');
  if (!process.exitCode) {
    const duplicates = await db.query(
      'SELECT count(*)::int AS total FROM (SELECT lower(username) FROM public.profiles GROUP BY lower(username) HAVING count(*)>1) d',
    );
    console.log('Username duplikat tanpa membedakan huruf:', duplicates.rows[0].total);
    if (duplicates.rows[0].total) process.exitCode = 1;
    const roles = await db.query(
      "SELECT DISTINCT role FROM public.profiles WHERE role NOT IN ('admin','user')",
    );
    console.log(
      'Role di luar admin/user:',
      roles.rows.map((r) => r.role),
    );
    if (roles.rowCount) process.exitCode = 1;
    const checks = await db.query(
      "SELECT conrelid::regclass::text AS table_name,pg_get_constraintdef(oid) AS rule FROM pg_constraint WHERE contype='c' AND conrelid IN ('public.profiles'::regclass,'public.reports'::regclass)",
    );
    console.log('CHECK constraints (pastikan provider powerbi diizinkan):', checks.rows);
    for (const table of Object.keys(expected)) {
      const perms = await db.query(
        `SELECT has_table_privilege('anon',$1,'SELECT,INSERT,UPDATE,DELETE') AS anon,
        has_table_privilege('authenticated',$1,'SELECT,INSERT,UPDATE,DELETE') AS authenticated`,
        ['public.' + table],
      );
      if (perms.rows[0].anon || perms.rows[0].authenticated) {
        console.log('Tinjau jalur Data API yang masih terbuka:', table);
        process.exitCode = 1;
      }
    }
  }
  await db.query('ROLLBACK');
  console.log(
    'Pemeriksaan hanya baca selesai. Login profiles, trigger, RLS/RPC, dan CRUD harus diuji di staging.',
  );
} catch (e) {
  reportError(e);
} finally {
  await db.end();
}
