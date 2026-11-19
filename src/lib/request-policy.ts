export function sameOrigin(origin: string | null, configured: string, production = false) {
  const expected = new URL(configured);
  if (expected.username || expected.password || !['http:', 'https:'].includes(expected.protocol)) throw new Error('Invalid APP_ORIGIN');
  if (production && expected.protocol !== 'https:') throw new Error('HTTPS APP_ORIGIN is required in production');
  return origin === expected.origin;
}
