-- ============================================================================
-- DRINK LOGS TABLE
-- ============================================================================

CREATE TABLE drink_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  drink_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  hydration_value INTEGER NOT NULL,
  time TIME NOT NULL,
  timestamp BIGINT NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_drink_logs_user_date ON drink_logs(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE drink_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_drink_logs" ON drink_logs
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
