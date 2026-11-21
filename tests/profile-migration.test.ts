import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
test('migration preserves profiles, removes Auth FK, revokes column access and is repeatable', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE TABLE public.profiles(id uuid PRIMARY KEY REFERENCES auth.users(id), username text NOT NULL);
 INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111');
 INSERT INTO profiles VALUES ('11111111-1111-4111-8111-111111111111','admin');
 GRANT SELECT ON profiles TO anon; GRANT SELECT(username) ON profiles TO authenticated;`);
    const sql = await readFile(
      new URL('../sql/005_profiles_password_login.sql', import.meta.url),
      'utf8',
    );
    await db.exec(sql);
    await db.exec(sql);
    assert.equal((await db.query('SELECT * FROM profiles')).rows.length, 1);
    await db.exec("INSERT INTO profiles(username) VALUES ('mandiri')");
    await assert.rejects(db.exec("INSERT INTO profiles(username) VALUES ('ADMIN')"));
    const perms = await db.query<{ allowed: boolean }>(
      "SELECT has_any_column_privilege('authenticated','profiles','SELECT') AS allowed",
    );
    assert.equal(perms.rows[0].allowed, false);
  } finally {
    await db.close();
  }
});
