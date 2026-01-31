-- ============================================================================
-- EXERCISE LOGS TABLE
-- ============================================================================

CREATE TABLE exercise_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration INTEGER,
  distance NUMERIC,
  weight NUMERIC,
  calories INTEGER,
  steps INTEGER,
  notes TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_exercise_logs_user_date ON exercise_logs(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_exercise_logs" ON exercise_logs
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
