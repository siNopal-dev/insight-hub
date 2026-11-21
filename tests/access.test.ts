import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { categoryAccess, reportSelect, adminAccess } from '../src/lib/access';

// Real PostgreSQL query execution with a fixture matching the visible schema.
// This tests application SQL rather than a second JavaScript permission implementation.
test('Category permissions execute correctly in PostgreSQL', async (t) => {
  const db = new PGlite();
  const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  try {
    await db.exec(`
      CREATE TABLE public.profiles (id uuid PRIMARY KEY,role text,is_active boolean,access_group_id uuid);
      CREATE TABLE public.access_groups (id uuid PRIMARY KEY,is_active boolean,all_categories boolean);
      CREATE TABLE public.access_group_categories (access_group_id uuid,category_id uuid,PRIMARY KEY(access_group_id,category_id));
      CREATE TABLE public.report_categories (id uuid PRIMARY KEY,name text,is_active boolean,sort_order int);
      CREATE TABLE public.reports (id uuid PRIMARY KEY,title text,category_id uuid,description text,embed_url text,created_at timestamptz,updated_at timestamptz,is_active boolean,sort_order int);
    `);
    for (const [n, all, active] of [
      [10, false, true],
      [20, false, true],
      [30, true, true],
      [40, true, false],
    ] as const) {
      await db.query('INSERT INTO access_groups VALUES($1,$2,$3)', [id(n), active, all]);
    }
    for (const [n, role, group, active] of [
      [1, 'user', 10, true],
      [2, 'user', 20, true],
      [3, 'user', 30, true],
      [4, 'admin', 30, true],
      [5, 'admin', 10, true],
      [6, 'user', null, true],
      [7, 'user', 40, true],
      [8, 'admin', 30, false],
      [9, 'unknown', 30, true],
    ] as const)
      await db.query('INSERT INTO profiles VALUES($1,$2,$3,$4)', [
        id(n),
        role,
        active,
        group ? id(group) : null,
      ]);
    for (const [n, name, active] of [
      [100, 'Produksi', true],
      [200, 'Keuangan', true],
      [300, 'Nonaktif', false],
    ] as const) {
      await db.query('INSERT INTO report_categories VALUES($1,$2,$3,0)', [id(n), name, active]);
      await db.query(
        "INSERT INTO reports VALUES($1,$2,$3,'','https://app.powerbi.com/view',now(),null,true,0)",
        [id(n + 1), name, id(n)],
      );
    }
    await db.query('INSERT INTO access_group_categories VALUES($1,$2),($3,$4)', [
      id(10),
      id(100),
      id(20),
      id(200),
    ]);
    const titles = async (user: number) =>
      (await db.query<{ title: string }>(`${reportSelect} ORDER BY r.title`, [id(user)])).rows.map(
        (r) => r.title,
      );
    const detail = async (user: number, report: number, admin = false) =>
      (
        await db.query(`${reportSelect} AND r.id=$2 ${admin ? `AND ${adminAccess}` : ''}`, [
          id(user),
          id(report),
        ])
      ).rows;
    const category = async (user: number, cat: number) =>
      (
        await db.query(
          `SELECT c.id FROM report_categories c WHERE c.id=$2 AND c.is_active AND ${categoryAccess} AND ${adminAccess}`,
          [id(user), id(cat)],
        )
      ).rows;
    await t.test('Production, finance, all and admin remain distinct', async () => {
      assert.deepEqual(await titles(1), ['Produksi']);
      assert.deepEqual(await titles(2), ['Keuangan']);
      assert.deepEqual(await titles(3), ['Keuangan', 'Produksi']);
      assert.deepEqual(await titles(4), ['Keuangan', 'Produksi']);
      assert.deepEqual(await titles(5), ['Produksi']);
    });
    await t.test('Direct report IDs cannot bypass category scope', async () => {
      assert.equal((await detail(1, 201)).length, 0);
      assert.equal((await detail(2, 101)).length, 0);
      assert.equal((await detail(1, 101)).length, 1);
    });
    await t.test(
      'Null/inactive groups, inactive profiles and unknown roles fail closed',
      async () => {
        for (const user of [6, 7, 8, 9]) assert.deepEqual(await titles(user), []);
        assert.equal((await detail(4, 301)).length, 0);
      },
    );
    await t.test(
      'All access does not grant admin; both source and destination are authorized',
      async () => {
        assert.equal((await detail(3, 101, true)).length, 0);
        assert.equal((await detail(5, 201, true)).length, 0);
        assert.equal((await detail(5, 101, true)).length, 1);
        assert.equal((await category(5, 200)).length, 0);
        assert.equal((await category(4, 200)).length, 1);
        assert.equal((await category(4, 300)).length, 0);
      },
    );
    await t.test('Mapping changes apply without a new login', async () => {
      await db.query('DELETE FROM access_group_categories WHERE access_group_id=$1', [id(10)]);
      assert.deepEqual(await titles(1), []);
      assert.equal((await detail(5, 101, true)).length, 0);
      await db.query('INSERT INTO access_group_categories VALUES($1,$2)', [id(10), id(100)]);
    });
    await t.test('Group all flag and active status are checked from live data', async () => {
      await db.query('UPDATE access_groups SET all_categories=false WHERE id=$1', [id(30)]);
      assert.deepEqual(await titles(4), []);
      await db.query('UPDATE access_groups SET all_categories=true,is_active=false WHERE id=$1', [
        id(30),
      ]);
      assert.deepEqual(await titles(4), []);
      await db.query('UPDATE access_groups SET is_active=true WHERE id=$1', [id(30)]);
    });
    await t.test('Inactive reports are hidden even from all-category admins', async () => {
      await db.query('UPDATE reports SET is_active=false WHERE id=$1', [id(101)]);
      assert.deepEqual(await titles(4), ['Keuangan']);
      assert.equal((await detail(4, 101, true)).length, 0);
    });
  } finally {
    await db.close();
  }
});
