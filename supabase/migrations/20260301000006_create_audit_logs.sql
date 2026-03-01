-- ============================================================
-- TASK-A09: Audit Log Persistence
-- Table: audit_logs (action, resource, resource_id, actor_id, actor_email, details, ip_address, created_at)
-- ============================================================

CREATE TABLE audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action        text NOT NULL,
  resource      text NOT NULL,
  resource_id   text,
  actor_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_email   text NOT NULL,
  details       jsonb DEFAULT '{}'::jsonb,
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_audit_logs_actor_email  ON audit_logs(actor_email);
CREATE INDEX idx_audit_logs_resource     ON audit_logs(resource);
CREATE INDEX idx_audit_logs_action       ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at   ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource_id  ON audit_logs(resource_id);

-- ── RLS ────────────────────────────────────────────────────

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
