-- ============================================================================
-- FIX: Cambiar IDs de UUID a TEXT para compatibilidad con Firebase IDs
-- ============================================================================

-- PASO 1: Eliminar políticas RLS
DROP POLICY IF EXISTS "own_profile" ON profiles;
DROP POLICY IF EXISTS "own_habit_completions" ON habit_completions;
DROP POLICY IF EXISTS "own_tasks" ON tasks;
DROP POLICY IF EXISTS "own_goals" ON goals;
DROP POLICY IF EXISTS "own_goal_tasks" ON goal_tasks;
DROP POLICY IF EXISTS "own_goal_entries" ON goal_entries;
DROP POLICY IF EXISTS "own_goal_numeric_entries" ON goal_numeric_entries;
DROP POLICY IF EXISTS "own_recipes" ON recipes;
DROP POLICY IF EXISTS "own_meal_plan_entries" ON meal_plan_entries;
DROP POLICY IF EXISTS "own_prepared_meals" ON prepared_meals;
DROP POLICY IF EXISTS "own_mood_entries" ON mood_entries;
DROP POLICY IF EXISTS "own_energy_entries" ON energy_entries;
DROP POLICY IF EXISTS "own_drink_logs" ON drink_logs;
DROP POLICY IF EXISTS "own_exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "own_pomodoro_sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "own_journal_entries" ON journal_entries;
DROP POLICY IF EXISTS "own_negative_habit_logs" ON negative_habit_logs;
DROP POLICY IF EXISTS "own_shopping_items" ON shopping_items;

-- PASO 2: Eliminar foreign keys
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_goal_id_fkey;
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
ALTER TABLE goal_tasks DROP CONSTRAINT IF EXISTS goal_tasks_goal_id_fkey;
ALTER TABLE goal_entries DROP CONSTRAINT IF EXISTS goal_entries_goal_id_fkey;
ALTER TABLE goal_numeric_entries DROP CONSTRAINT IF EXISTS goal_numeric_entries_goal_id_fkey;
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_user_id_fkey;
ALTER TABLE meal_plan_entries DROP CONSTRAINT IF EXISTS meal_plan_entries_user_id_fkey;
ALTER TABLE meal_plan_entries DROP CONSTRAINT IF EXISTS meal_plan_entries_recipe_id_fkey;
ALTER TABLE prepared_meals DROP CONSTRAINT IF EXISTS prepared_meals_user_id_fkey;
ALTER TABLE mood_entries DROP CONSTRAINT IF EXISTS mood_entries_user_id_fkey;
ALTER TABLE energy_entries DROP CONSTRAINT IF EXISTS energy_entries_user_id_fkey;
ALTER TABLE drink_logs DROP CONSTRAINT IF EXISTS drink_logs_user_id_fkey;
ALTER TABLE exercise_logs DROP CONSTRAINT IF EXISTS exercise_logs_user_id_fkey;
ALTER TABLE pomodoro_sessions DROP CONSTRAINT IF EXISTS pomodoro_sessions_user_id_fkey;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_user_id_fkey;
ALTER TABLE negative_habit_logs DROP CONSTRAINT IF EXISTS negative_habit_logs_user_id_fkey;
ALTER TABLE shopping_items DROP CONSTRAINT IF EXISTS shopping_items_user_id_fkey;
ALTER TABLE habit_completions DROP CONSTRAINT IF EXISTS habit_completions_user_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- PASO 3: Cambiar tipos de columnas
-- Profiles
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Habits
ALTER TABLE habit_completions ALTER COLUMN user_id TYPE TEXT;

-- Tasks
ALTER TABLE tasks ALTER COLUMN id TYPE TEXT;
ALTER TABLE tasks ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE tasks ALTER COLUMN goal_id TYPE TEXT;

-- Goals
ALTER TABLE goals ALTER COLUMN id TYPE TEXT;
ALTER TABLE goals ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE goal_tasks ALTER COLUMN id TYPE TEXT;
ALTER TABLE goal_tasks ALTER COLUMN goal_id TYPE TEXT;

ALTER TABLE goal_entries ALTER COLUMN id TYPE TEXT;
ALTER TABLE goal_entries ALTER COLUMN goal_id TYPE TEXT;

ALTER TABLE goal_numeric_entries ALTER COLUMN id TYPE TEXT;
ALTER TABLE goal_numeric_entries ALTER COLUMN goal_id TYPE TEXT;

-- Recipes
ALTER TABLE recipes ALTER COLUMN id TYPE TEXT;
ALTER TABLE recipes ALTER COLUMN user_id TYPE TEXT;

-- Meal Plan
ALTER TABLE meal_plan_entries ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE meal_plan_entries ALTER COLUMN recipe_id TYPE TEXT;

-- Prepared Meals
ALTER TABLE prepared_meals ALTER COLUMN id TYPE TEXT;
ALTER TABLE prepared_meals ALTER COLUMN user_id TYPE TEXT;

-- Mood
ALTER TABLE mood_entries ALTER COLUMN id TYPE TEXT;
ALTER TABLE mood_entries ALTER COLUMN user_id TYPE TEXT;

-- Energy
ALTER TABLE energy_entries ALTER COLUMN id TYPE TEXT;
ALTER TABLE energy_entries ALTER COLUMN user_id TYPE TEXT;

-- Drinks
ALTER TABLE drink_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE drink_logs ALTER COLUMN user_id TYPE TEXT;

-- Exercise
ALTER TABLE exercise_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE exercise_logs ALTER COLUMN user_id TYPE TEXT;

-- Pomodoro
ALTER TABLE pomodoro_sessions ALTER COLUMN id TYPE TEXT;
ALTER TABLE pomodoro_sessions ALTER COLUMN user_id TYPE TEXT;

-- Journal
ALTER TABLE journal_entries ALTER COLUMN user_id TYPE TEXT;

-- Negative Habits
ALTER TABLE negative_habit_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE negative_habit_logs ALTER COLUMN user_id TYPE TEXT;

-- Shopping
ALTER TABLE shopping_items ALTER COLUMN id TYPE TEXT;
ALTER TABLE shopping_items ALTER COLUMN user_id TYPE TEXT;

-- PASO 4: Recrear foreign keys (sin referencias a auth.users)
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD CONSTRAINT tasks_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;
ALTER TABLE goals ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE goal_tasks ADD CONSTRAINT goal_tasks_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;
ALTER TABLE goal_entries ADD CONSTRAINT goal_entries_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;
ALTER TABLE goal_numeric_entries ADD CONSTRAINT goal_numeric_entries_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;
ALTER TABLE recipes ADD CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE meal_plan_entries ADD CONSTRAINT meal_plan_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE meal_plan_entries ADD CONSTRAINT meal_plan_entries_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id);
ALTER TABLE prepared_meals ADD CONSTRAINT prepared_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE mood_entries ADD CONSTRAINT mood_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE energy_entries ADD CONSTRAINT energy_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE drink_logs ADD CONSTRAINT drink_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE exercise_logs ADD CONSTRAINT exercise_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE pomodoro_sessions ADD CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE negative_habit_logs ADD CONSTRAINT negative_habit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE shopping_items ADD CONSTRAINT shopping_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE habit_completions ADD CONSTRAINT habit_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- PASO 5: Recrear políticas RLS
CREATE POLICY "own_profile" ON profiles FOR ALL USING (id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_habit_completions" ON habit_completions FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_tasks" ON tasks FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_goals" ON goals FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_goal_tasks" ON goal_tasks FOR ALL USING (goal_id IN (SELECT id FROM goals WHERE user_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "own_goal_entries" ON goal_entries FOR ALL USING (goal_id IN (SELECT id FROM goals WHERE user_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "own_goal_numeric_entries" ON goal_numeric_entries FOR ALL USING (goal_id IN (SELECT id FROM goals WHERE user_id = current_setting('request.jwt.claim.sub', true)));
CREATE POLICY "own_recipes" ON recipes FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_meal_plan_entries" ON meal_plan_entries FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_prepared_meals" ON prepared_meals FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_mood_entries" ON mood_entries FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_energy_entries" ON energy_entries FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_drink_logs" ON drink_logs FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_exercise_logs" ON exercise_logs FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_pomodoro_sessions" ON pomodoro_sessions FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_journal_entries" ON journal_entries FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_negative_habit_logs" ON negative_habit_logs FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
CREATE POLICY "own_shopping_items" ON shopping_items FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));

-- PASO 6: Cambiar defaults para nuevos registros
ALTER TABLE tasks ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE goals ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE goal_tasks ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE goal_entries ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE goal_numeric_entries ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE recipes ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE prepared_meals ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE mood_entries ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE energy_entries ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE drink_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE exercise_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE pomodoro_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE negative_habit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE shopping_items ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
