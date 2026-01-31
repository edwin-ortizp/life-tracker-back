-- ============================================================================
-- JOURNAL TABLES
-- ============================================================================

-- Journal Entries (daily entries)
CREATE TABLE journal_entries (
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  text TEXT NOT NULL,
  display_time TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- Journal Weekly Summary (aggregated stats)
CREATE TABLE journal_weekly_summary (
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  entries_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, year, week)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS journal_weekly_summary_user_id_idx
  ON journal_weekly_summary (user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_weekly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_journal_entries" ON journal_entries
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'journal_weekly_summary'
      AND policyname = 'own_journal_weekly_summary'
  ) THEN
    CREATE POLICY "own_journal_weekly_summary" ON journal_weekly_summary
      FOR ALL USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- ============================================================================
-- TRIGGER: Update weekly summary on journal entry changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_journal_weekly_summary()
RETURNS TRIGGER AS $$
DECLARE
  old_year INTEGER;
  old_week INTEGER;
  new_year INTEGER;
  new_week INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_year := EXTRACT(ISOYEAR FROM OLD.date::date);
    old_week := EXTRACT(WEEK FROM OLD.date::date);

    UPDATE journal_weekly_summary
      SET entries_count = GREATEST(entries_count - 1, 0),
          updated_at = NOW()
      WHERE user_id = OLD.user_id AND year = old_year AND week = old_week;

    DELETE FROM journal_weekly_summary
      WHERE user_id = OLD.user_id AND year = old_year AND week = old_week AND entries_count <= 0;

    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    new_year := EXTRACT(ISOYEAR FROM NEW.date::date);
    new_week := EXTRACT(WEEK FROM NEW.date::date);

    INSERT INTO journal_weekly_summary (user_id, year, week, entries_count, updated_at)
      VALUES (NEW.user_id, new_year, new_week, 1, NOW())
    ON CONFLICT (user_id, year, week)
      DO UPDATE SET entries_count = journal_weekly_summary.entries_count + 1,
                    updated_at = NOW();

    RETURN NEW;
  ELSE
    old_year := EXTRACT(ISOYEAR FROM OLD.date::date);
    old_week := EXTRACT(WEEK FROM OLD.date::date);
    new_year := EXTRACT(ISOYEAR FROM NEW.date::date);
    new_week := EXTRACT(WEEK FROM NEW.date::date);

    IF OLD.user_id = NEW.user_id AND old_year = new_year AND old_week = new_week THEN
      RETURN NEW;
    END IF;

    UPDATE journal_weekly_summary
      SET entries_count = GREATEST(entries_count - 1, 0),
          updated_at = NOW()
      WHERE user_id = OLD.user_id AND year = old_year AND week = old_week;

    DELETE FROM journal_weekly_summary
      WHERE user_id = OLD.user_id AND year = old_year AND week = old_week AND entries_count <= 0;

    INSERT INTO journal_weekly_summary (user_id, year, week, entries_count, updated_at)
      VALUES (NEW.user_id, new_year, new_week, 1, NOW())
    ON CONFLICT (user_id, year, week)
      DO UPDATE SET entries_count = journal_weekly_summary.entries_count + 1,
                    updated_at = NOW();

    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS journal_weekly_summary_trigger ON journal_entries;
CREATE TRIGGER journal_weekly_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION update_journal_weekly_summary();
