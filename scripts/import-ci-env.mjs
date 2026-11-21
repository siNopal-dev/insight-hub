import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
const source = process.argv[2];
if (!source) {
  console.error('Pemakaian: npm run config:import -- /path/project-lama/.env');
  process.exit(1);
}
if (fs.existsSync('.env.local')) {
  console.error('.env.local sudah ada. Tidak ditimpa. Edit konfigurasi tersebut secara manual.');
  process.exit(1);
}
const values = {};
for (const line of fs.readFileSync(source, 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  const i = line.indexOf('=');
  if (i < 0) continue;
  let value = line.slice(i + 1).trim();
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  )
    value = value.slice(1, -1);
  values[line.slice(0, i).trim()] = value;
}
for (const field of ['hostname', 'username', 'password', 'database'])
  if (!values['database.default.' + field]) {
    console.error('Konfigurasi lama kurang: ' + field);
    process.exit(1);
  }
const url = new URL('postgresql://localhost');
url.hostname = values['database.default.hostname'];
url.port = values['database.default.port'] || '5432';
url.username = encodeURIComponent(values['database.default.username']);
url.password = encodeURIComponent(values['database.default.password']);
url.pathname = '/' + encodeURIComponent(values['database.default.database']);
const text = [
  'APP_ORIGIN=http://localhost:3000',
  `DATABASE_URL=${JSON.stringify(url.toString())}`,
  `SESSION_ENCRYPTION_KEY=${randomBytes(32).toString('base64')}`,
  'DATABASE_CA_CERT=',
  'REPORT_EMBED_HOSTS=app.powerbi.com',
  'TRUST_PROXY_IP=false',
  'SESSION_TTL_MINUTES=30',
  '',
].join('\n');
fs.writeFileSync('.env.local', text, { flag: 'wx', mode: 0o600 });
console.log(
  '.env.local dibuat. Nilai rahasia tidak ditampilkan. Verifikasi CA Supabase sebelum db:check.',
);
