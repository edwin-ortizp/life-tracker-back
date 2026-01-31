-- ============================================================================
-- NEGATIVE HABITS TABLES
-- ============================================================================

-- Negative Habit Definitions (catalog)
CREATE TABLE negative_habit_definitions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  description TEXT
);

-- Negative Habit Logs (user tracking)
CREATE TABLE negative_habit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id INTEGER REFERENCES negative_habit_definitions,
  timestamp BIGINT NOT NULL,
  note TEXT
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE negative_habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_negative_habit_logs" ON negative_habit_logs
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
