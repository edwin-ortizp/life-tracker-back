-- ============================================================================
-- LIFE TRACKER - INITIAL SCHEMA
-- Migration: Firebase/Firestore → PostgreSQL/Supabase
-- ============================================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTH
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HABITS
-- ============================================================================

CREATE TABLE habit_definitions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'night', 'anytime')),
  goal_duration TEXT,
  base_time TIME
);

CREATE TABLE habit_completions (
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  habit_id INTEGER REFERENCES habit_definitions,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, habit_id, date)
);

-- ============================================================================
-- TASKS & GOALS
-- ============================================================================

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
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

CREATE TABLE goal_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE goal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals ON DELETE CASCADE,
  text TEXT NOT NULL,
  date DATE NOT NULL,
  is_milestone BOOLEAN DEFAULT false
);

CREATE TABLE goal_numeric_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  goal_id UUID REFERENCES goals ON DELETE SET NULL,
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
-- RECIPES & MEALS
-- ============================================================================

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
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

CREATE TABLE meal_plan_entries (
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT,
  recipe_id UUID REFERENCES recipes,
  name TEXT,
  notes TEXT,
  calories INTEGER,
  PRIMARY KEY (user_id, date, meal_type)
);

CREATE TABLE prepared_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  name TEXT NOT NULL,
  portions INTEGER
);

-- ============================================================================
-- MOOD & ENERGY
-- ============================================================================

CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  date DATE NOT NULL,
  emoji TEXT NOT NULL,
  text TEXT NOT NULL,
  value INTEGER CHECK (value BETWEEN 1 AND 10),
  time TIME NOT NULL,
  timestamp BIGINT NOT NULL
);

CREATE TABLE energy_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  date DATE NOT NULL,
  level INTEGER CHECK (level BETWEEN 1 AND 5) NOT NULL,
  time TIME NOT NULL,
  timestamp BIGINT NOT NULL,
  comment TEXT
);

-- ============================================================================
-- WATER/DRINKS
-- ============================================================================

CREATE TABLE drink_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  date DATE NOT NULL,
  drink_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  hydration_value INTEGER NOT NULL,
  time TIME NOT NULL,
  timestamp BIGINT NOT NULL
);

-- ============================================================================
-- EXERCISE
-- ============================================================================

CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration INTEGER,
  distance NUMERIC,
  weight NUMERIC,
  calories INTEGER,
  steps INTEGER,
  notes TEXT
);

-- ============================================================================
-- POMODORO
-- ============================================================================

CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time JSONB NOT NULL,
  end_time JSONB,
  duration INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  description TEXT,
  locked_by_device_id TEXT,
  locked_at TIMESTAMPTZ
);

-- ============================================================================
-- JOURNAL
-- ============================================================================

CREATE TABLE journal_entries (
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  date DATE NOT NULL,
  text TEXT NOT NULL,
  display_time TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- ============================================================================
-- NEGATIVE HABITS
-- ============================================================================

CREATE TABLE negative_habit_definitions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  description TEXT
);

CREATE TABLE negative_habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  habit_id INTEGER REFERENCES negative_habit_definitions,
  timestamp BIGINT NOT NULL,
  note TEXT
);

-- ============================================================================
-- SHOPPING LIST
-- ============================================================================

CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  name TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  to_buy INTEGER DEFAULT 0,
  price NUMERIC,
  category TEXT,
  place TEXT,
  consume_by DATE,
  status TEXT CHECK (status IN ('in-stock', 'to-buy', 'low-stock')) NOT NULL,
  next_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_numeric_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prepared_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE negative_habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_habit_completions" ON habit_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_goal_tasks" ON goal_tasks FOR ALL USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));
CREATE POLICY "own_goal_entries" ON goal_entries FOR ALL USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));
CREATE POLICY "own_goal_numeric_entries" ON goal_numeric_entries FOR ALL USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));
CREATE POLICY "own_recipes" ON recipes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_meal_plan_entries" ON meal_plan_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_prepared_meals" ON prepared_meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_mood_entries" ON mood_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_energy_entries" ON energy_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_drink_logs" ON drink_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_exercise_logs" ON exercise_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_pomodoro_sessions" ON pomodoro_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_journal_entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_negative_habit_logs" ON negative_habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_shopping_items" ON shopping_items FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_user_dates ON tasks(user_id, start_date, end_date);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, date);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, date);
CREATE INDEX idx_energy_entries_user_date ON energy_entries(user_id, date);
CREATE INDEX idx_drink_logs_user_date ON drink_logs(user_id, date);
CREATE INDEX idx_exercise_logs_user_date ON exercise_logs(user_id, date);
CREATE INDEX idx_pomodoro_sessions_user_date ON pomodoro_sessions(user_id, date);
CREATE INDEX idx_shopping_items_user_status ON shopping_items(user_id, status);
