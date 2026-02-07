-- ============================================================================
-- RELATIONSHIPS MODULE TABLES
-- ============================================================================

-- Ensure tasks can be referenced by composite foreign key (id, user_id)
ALTER TABLE tasks
  ADD CONSTRAINT tasks_id_user_id_unique UNIQUE (id, user_id);

-- Circles
CREATE TABLE circles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id, user_id),
  UNIQUE (user_id, name)
);

-- People / relationships
CREATE TABLE relationships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT,
  category TEXT NOT NULL CHECK (category IN ('familia', 'amistad', 'social')),
  birthday_date DATE,
  birthday_month SMALLINT CHECK (birthday_month BETWEEN 1 AND 12),
  birthday_day SMALLINT CHECK (birthday_day BETWEEN 1 AND 31),
  last_contact_at TIMESTAMPTZ,
  next_contact_suggested_at TIMESTAMPTZ,
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id, user_id),
  FOREIGN KEY (circle_id, user_id) REFERENCES circles(id, user_id) ON DELETE RESTRICT
);

-- Relationship events
CREATE TABLE events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_id TEXT NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'exam', 'surgery', 'travel', 'grief', 'medical_check', 'custom')),
  event_date DATE NOT NULL,
  start_date DATE,
  end_date DATE,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id, user_id),
  FOREIGN KEY (relationship_id, user_id) REFERENCES relationships(id, user_id) ON DELETE RESTRICT,
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- M:N links between people and tasks
CREATE TABLE relationship_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, relationship_id, task_id),
  UNIQUE (id, user_id),
  FOREIGN KEY (relationship_id, user_id) REFERENCES relationships(id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (task_id, user_id) REFERENCES tasks(id, user_id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_circles_user_sort ON circles(user_id, sort_order, name);
CREATE INDEX idx_relationships_user_circle ON relationships(user_id, circle_id);
CREATE INDEX idx_relationships_user_archived ON relationships(user_id, is_archived, updated_at DESC);
CREATE INDEX idx_events_user_relationship ON events(user_id, relationship_id);
CREATE INDEX idx_events_user_archived_date ON events(user_id, is_archived, event_date DESC);
CREATE INDEX idx_relationship_tasks_user_relationship ON relationship_tasks(user_id, relationship_id);
CREATE INDEX idx_relationship_tasks_user_task ON relationship_tasks(user_id, task_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_circles" ON circles
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "insert_own_circles" ON circles
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "update_own_circles" ON circles
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "delete_own_circles" ON circles
  FOR DELETE USING (user_id = auth.uid()::text);

CREATE POLICY "select_own_relationships" ON relationships
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "insert_own_relationships" ON relationships
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "update_own_relationships" ON relationships
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "delete_own_relationships" ON relationships
  FOR DELETE USING (user_id = auth.uid()::text);

CREATE POLICY "select_own_events" ON events
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "insert_own_events" ON events
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "update_own_events" ON events
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "delete_own_events" ON events
  FOR DELETE USING (user_id = auth.uid()::text);

CREATE POLICY "select_own_relationship_tasks" ON relationship_tasks
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "insert_own_relationship_tasks" ON relationship_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "update_own_relationship_tasks" ON relationship_tasks
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "delete_own_relationship_tasks" ON relationship_tasks
  FOR DELETE USING (user_id = auth.uid()::text);
