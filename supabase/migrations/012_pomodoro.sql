-- ============================================================================
-- POMODORO SESSIONS TABLE
-- ============================================================================

CREATE TABLE pomodoro_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time JSONB NOT NULL,
  end_time JSONB,
  duration INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  description TEXT,
  locked_by_device_id TEXT,
  locked_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_pomodoro_sessions_user_date ON pomodoro_sessions(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_pomodoro_sessions" ON pomodoro_sessions
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
