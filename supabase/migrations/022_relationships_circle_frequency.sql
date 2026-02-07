-- ============================================================================
-- RELATIONSHIPS: CIRCLE CONTACT FREQUENCY
-- ============================================================================

ALTER TABLE circles
  ADD COLUMN IF NOT EXISTS contact_frequency_days INTEGER
  CHECK (contact_frequency_days IS NULL OR contact_frequency_days > 0);

CREATE INDEX IF NOT EXISTS idx_circles_user_sort_v2
  ON circles(user_id, sort_order);
