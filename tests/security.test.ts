import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { loginSchema, reportSchema, validEmbedUrl, filterReports } from '../src/lib/validation';
import { sameOrigin } from '../src/lib/request-policy';
import { seal, unseal, sessionId, hashSession } from '../src/lib/crypto';
test('Origin exact match: blocks missing, null, lookalike, different port and insecure production', () => {
  assert.equal(sameOrigin('https://portal.example.com','https://portal.example.com',true),true);
  for (const origin of [null,'null','https://portal.example.com.evil.test','https://evil.test','https://portal.example.com:8443']) assert.equal(sameOrigin(origin,'https://portal.example.com',true),false);
  assert.throws(()=>sameOrigin('http://localhost:3000','http://localhost:3000',true));
});
test('Embed URL restricts protocol, hostname, credentials and ports', () => {
  assert.equal(validEmbedUrl('https://app.powerbi.com/view?r=abc'),true);
  for(const url of ['javascript:alert(1)','data:text/html,test','http://app.powerbi.com/view','https://app.powerbi.com.evil.test/','https://evil.test/?next=https://app.powerbi.com','https://user:pass@app.powerbi.com/view','https://app.powerbi.com:444/view']) assert.equal(validEmbedUrl(url),false,url);
});
test('Server validation rejects untrusted fields, malformed IDs and oversized input', () => {
  const valid={title:'Penjualan',category:'Penjualan',description:'Laporan',embedUrl:'https://app.powerbi.com/view?r=abc'};
  assert.equal(reportSchema.safeParse(valid).success,true);
  for(const patch of [{id:"' OR 1=1"},{role:'admin'},{title:' '},{title:'x'.repeat(161)},{category:'<script>'},{embedUrl:'javascript:alert(1)'}]) assert.equal(reportSchema.safeParse({...valid,...patch}).success,false);
  assert.equal(loginSchema.safeParse({username:'admin',password:'x',role:'admin'}).success,false);
  assert.equal(loginSchema.safeParse({username:'admin',password:''}).success,false);
});
test('Search preserves the selected category', () => {
  const rows=[{title:'Bulanan',category:'Keuangan',description:''},{title:'Bulanan',category:'Penjualan',description:''}];
  assert.equal(filterReports(rows,'Penjualan','bulan').length,1);
  assert.equal(filterReports(rows,'Penjualan','BULAN')[0].category,'Penjualan');
  assert.equal(filterReports(rows,'all','tak ada').length,0);
});
test('Encrypted legacy token detects tampering; raw cookie token is not the stored hash', () => {
  process.env.SESSION_ENCRYPTION_KEY=randomBytes(32).toString('base64');
  const token='private-legacy-token', encrypted=seal(token);
  assert.equal(unseal(encrypted),token); assert.ok(!encrypted.includes(token));
  const bytes=Buffer.from(encrypted,'base64url'); bytes[bytes.length-1]^=1;
  assert.throws(()=>unseal(bytes.toString('base64url')));
  const cookie=sessionId(); assert.match(cookie,/^[\w-]{43}$/); assert.equal(hashSession(cookie).length,64); assert.notEqual(cookie,hashSession(cookie));
  process.env.SESSION_ENCRYPTION_KEY='bad'; assert.throws(()=>seal(token));
});
