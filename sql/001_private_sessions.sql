-- Jalankan dengan pemilik database. Tidak mengubah public.reports atau akun lama.
BEGIN;
CREATE SCHEMA IF NOT EXISTS insight_hub_private;
REVOKE ALL ON SCHEMA insight_hub_private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS insight_hub_private.sessions (
  sid text PRIMARY KEY CHECK (length(sid)=64),
  user_id text NOT NULL,
  user_data jsonb NOT NULL CHECK (user_data->>'role' IN ('admin','user')),
  encrypted_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS ih_sessions_expiry_idx ON insight_hub_private.sessions(expires_at);
CREATE INDEX IF NOT EXISTS ih_sessions_user_idx ON insight_hub_private.sessions(user_id);
CREATE TABLE IF NOT EXISTS insight_hub_private.rate_limits (
  key text PRIMARY KEY, attempts integer NOT NULL DEFAULT 1, reset_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS ih_rate_limits_expiry_idx ON insight_hub_private.rate_limits(reset_at);
ALTER TABLE insight_hub_private.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_hub_private.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA insight_hub_private FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA insight_hub_private REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
COMMENT ON SCHEMA insight_hub_private IS 'Server-only Next.js sessions and login throttling; never expose via Supabase Data API';
COMMIT;
