-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  task_code INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  category TEXT,
  priority TEXT CHECK (priority IN ('do', 'decide', 'delegate', 'delete')),
  size TEXT CHECK (size IN ('pequeña', 'mediana', 'grande')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_recurrent BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  recurrence JSONB,
  progress INTEGER DEFAULT 0,
  elapsed_seconds INTEGER DEFAULT 0,
  timer_start_time JSONB,
  timer_paused BOOLEAN DEFAULT false,
  paused_duration INTEGER DEFAULT 0,
  timer_active BOOLEAN DEFAULT false,
  estimated_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_user_dates ON tasks(user_id, start_date, end_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_tasks" ON tasks
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
