-- ============================================================================
-- HABITS TABLES
-- ============================================================================

-- Habit Definitions (catalog)
CREATE TABLE habit_definitions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'night', 'anytime')),
  goal_duration TEXT,
  base_time TIME
);

-- Habit Completions (user tracking)
CREATE TABLE habit_completions (
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id INTEGER REFERENCES habit_definitions,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, habit_id, date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_habit_completions" ON habit_completions
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
