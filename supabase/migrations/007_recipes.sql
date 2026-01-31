-- ============================================================================
-- RECIPES & MEALS TABLES
-- ============================================================================

-- Recipes (catalog)
CREATE TABLE recipes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('fácil', 'media', 'difícil')),
  prep_time INTEGER,
  meal_type TEXT,
  ingredients JSONB,
  instructions TEXT,
  nutrition JSONB,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Plan Entries (weekly planning)
CREATE TABLE meal_plan_entries (
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT,
  recipe_id TEXT REFERENCES recipes(id),
  name TEXT,
  notes TEXT,
  calories INTEGER,
  PRIMARY KEY (user_id, date, meal_type)
);

-- Prepared Meals (batch cooking)
CREATE TABLE prepared_meals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  portions INTEGER
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prepared_meals ENABLE ROW LEVEL SECURITY;

-- Nota: Las políticas RLS para recipes se definen en 020_fix_rls_auth_uid.sql

CREATE POLICY "own_meal_plan_entries" ON meal_plan_entries
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "own_prepared_meals" ON prepared_meals
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
