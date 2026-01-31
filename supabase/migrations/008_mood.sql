-- ============================================================================
-- MOOD ENTRIES TABLE
-- ============================================================================

CREATE TABLE mood_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emoji TEXT NOT NULL,
  text TEXT NOT NULL,
  value INTEGER CHECK (value BETWEEN 1 AND 10),
  time TIME NOT NULL,
  timestamp BIGINT NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_mood_entries" ON mood_entries
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
