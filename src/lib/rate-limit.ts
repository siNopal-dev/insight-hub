import 'server-only';
import { pool } from './db';
import { opaqueKey } from './crypto';
import { HttpError } from './http';
export async function rateLimit(key: string, max: number, seconds = 900) {
  const { rows } = await pool().query<{ attempts: number }>(
    `
    INSERT INTO insight_hub_private.rate_limits (key, attempts, reset_at) VALUES ($1, 1, now()+make_interval(secs => $2))
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN insight_hub_private.rate_limits.reset_at <= now() THEN 1 ELSE insight_hub_private.rate_limits.attempts+1 END,
      reset_at = CASE WHEN insight_hub_private.rate_limits.reset_at <= now() THEN now()+make_interval(secs => $2) ELSE insight_hub_private.rate_limits.reset_at END
    RETURNING attempts`,
    [opaqueKey(key), seconds],
  );
  if (rows[0].attempts > max)
    throw new HttpError(429, 'Terlalu banyak percobaan. Silakan coba lagi nanti.');
}
