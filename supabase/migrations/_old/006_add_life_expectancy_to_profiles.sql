-- ============================================================================
-- PROFILES: LIFE EXPECTANCY
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS life_expectancy_years INTEGER;
