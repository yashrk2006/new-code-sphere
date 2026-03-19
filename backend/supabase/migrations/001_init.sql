-- ================================================================
-- Vision AIoT — Supabase SQL Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

-- ── Security Users ──────────────────────────────────────────────
-- Separate from Prisma auth users. Used by /api/security/users
CREATE TABLE IF NOT EXISTS security_users (
    id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    email      text        NOT NULL UNIQUE,
    role       text        NOT NULL CHECK (role IN ('Admin', 'Operator', 'Viewer')),
    status     text        DEFAULT 'Active',
    created_at timestamptz DEFAULT now()
);

-- ── Audit Logs ──────────────────────────────────────────────────
-- Tracks all security events: logins, token usage, user management
CREATE TABLE IF NOT EXISTS audit_logs (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    action       text        NOT NULL,
    actor_email  text        NOT NULL,
    ip_address   text        NOT NULL,
    timestamp    timestamptz DEFAULT now()
);

-- ── Edge API Tokens ─────────────────────────────────────────────
-- JWT tokens for Python edge nodes to authenticate with the backend
CREATE TABLE IF NOT EXISTS edge_tokens (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    name         text        NOT NULL,
    token_prefix text        NOT NULL,
    scopes       text[]      DEFAULT ARRAY['inference:push'],
    status       text        DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at   timestamptz DEFAULT now(),
    last_used    timestamptz
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_edge_tokens_status   ON edge_tokens (status);

-- ── Seed: initial admin user ─────────────────────────────────────
INSERT INTO security_users (email, role, status)
VALUES ('admin@visionaiot.dev', 'Admin', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Done!
SELECT 'Migration complete ✅' AS result;
