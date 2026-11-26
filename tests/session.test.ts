import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { sessionSelect, sessionUser, type SessionRecord } from '../src/lib/session-record';
import { hashSession } from '../src/lib/crypto';
import { SESSION_TTL_SECONDS } from '../src/lib/session-duration';
test('Sessions last exactly 14 days from login without activity-based renewal', () => {
  assert.equal(SESSION_TTL_SECONDS, 14 * 24 * 60 * 60);
});
test('Session query checks expiry, provider and live profile; password changes revoke access', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE SCHEMA insight_hub_private;
 CREATE TABLE insight_hub_private.sessions(sid text,user_id text,user_data jsonb,expires_at timestamptz);
 CREATE TABLE profiles(id uuid,username text,full_name text,role text,department_id uuid,access_group_id uuid,is_active bool,password_hash text);
 CREATE TABLE departments(id uuid,name text);
 CREATE TABLE access_groups(id uuid,name text,is_active bool,all_categories bool);
 INSERT INTO profiles VALUES('11111111-1111-4111-8111-111111111111','demo','Demo','admin',null,null,true,'hash-a');`);
    await db.query(
      `INSERT INTO insight_hub_private.sessions VALUES ('sid','11111111-1111-4111-8111-111111111111',$1,now()+interval '1 hour')`,
      [JSON.stringify({ auth_provider: 'profiles', credential_tag: hashSession('hash-a') })],
    );
    const row = async () => (await db.query<SessionRecord>(sessionSelect, ['sid'])).rows[0];
    let user = sessionUser(await row());
    assert.equal(user?.role, 'admin');
    assert.ok(!('password_hash' in user!));
    await db.exec("UPDATE profiles SET role='user'");
    assert.equal(sessionUser(await row())?.role, 'user');
    await db.exec("UPDATE profiles SET password_hash='hash-b'");
    assert.equal(sessionUser(await row()), null);
    await db.exec("UPDATE profiles SET password_hash='hash-a',is_active=false");
    assert.equal(await row(), undefined);
    await db.exec(
      "UPDATE profiles SET is_active=true; UPDATE insight_hub_private.sessions SET expires_at=now()-interval '1 second'",
    );
    assert.equal(await row(), undefined);
    await db.exec(
      `UPDATE insight_hub_private.sessions SET expires_at=now()+interval '1 hour',user_data='{"auth_provider":"supabase"}'`,
    );
    assert.equal(await row(), undefined);
  } finally {
    await db.close();
  }
});
