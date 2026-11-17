-- Ejecutar UNA vez en Neon SQL Editor antes de publicar.
CREATE TABLE IF NOT EXISTS households (
 id UUID PRIMARY KEY, name TEXT NOT NULL DEFAULT 'Hogar',
 data JSONB NOT NULL, revision BIGINT NOT NULL DEFAULT 0,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY, household_id UUID NOT NULL REFERENCES households(id),
 member_id TEXT NOT NULL, username TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','member')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(household_id,member_id)
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS login_attempts (
 username TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0,
 blocked_until TIMESTAMPTZ,
 last_attempt TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
-- SOLO una familia para este despliegue inicial: crear admin requiere ADMIN_SETUP_TOKEN.
