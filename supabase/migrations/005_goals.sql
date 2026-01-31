-- ============================================================================
-- GOALS TABLES
-- ============================================================================

-- Main Goals Table
CREATE TABLE goals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
  start_date DATE,
  due_date DATE,
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  numeric_goal JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal Tasks (subtasks)
CREATE TABLE goal_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Goal Entries (text entries/milestones)
CREATE TABLE goal_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date DATE NOT NULL,
  is_milestone BOOLEAN DEFAULT false
);

-- Goal Numeric Entries (numeric tracking)
CREATE TABLE goal_numeric_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_numeric_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_goals" ON goals
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "own_goal_tasks" ON goal_tasks
  FOR ALL USING (goal_id IN (SELECT id FROM goals WHERE user_id = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "own_goal_entries" ON goal_entries
  FOR ALL USING (goal_id IN (SELECT id FROM goals WHERE user_id = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "own_goal_numeric_entries" ON goal_numeric_entries
  FOR ALL USING (goal_id IN (SELECT id FROM goals WHERE user_id = current_setting('request.jwt.claim.sub', true)));
