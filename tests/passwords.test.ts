import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/lib/passwords';
test('password hashing verifies correct password, rejects incorrect/missing/malformed hashes', async () => {
  const password = 'Contoh-password-123';
  const a = await hashPassword(password);
  const b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword('salah', a), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, 'plaintext'), false);
  await assert.rejects(hashPassword('1234'));
  const minimum = await hashPassword('12345');
  assert.equal(await verifyPassword('12345', minimum), true);
  const maximum = await hashPassword('x'.repeat(128));
  assert.equal(await verifyPassword('x'.repeat(128), maximum), true);
  await assert.rejects(hashPassword('x'.repeat(129)));
});
