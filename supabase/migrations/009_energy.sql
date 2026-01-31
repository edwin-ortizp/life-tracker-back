-- ============================================================================
-- ENERGY ENTRIES TABLE
-- ============================================================================

CREATE TABLE energy_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  level INTEGER CHECK (level BETWEEN 1 AND 5) NOT NULL,
  time TIME NOT NULL,
  timestamp BIGINT NOT NULL,
  comment TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_energy_entries_user_date ON energy_entries(user_id, date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE energy_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_energy_entries" ON energy_entries
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
