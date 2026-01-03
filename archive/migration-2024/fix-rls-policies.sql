-- Script para arreglar las políticas RLS que están bloqueando INSERT/UPDATE/DELETE
-- Las políticas actuales solo permiten SELECT, necesitamos permitir todas las operaciones

-- IMPORTANTE: Ejecuta este script en Supabase SQL Editor

BEGIN;

-- ============================================================================
-- PASO 1: Eliminar políticas existentes (que están mal configuradas)
-- ============================================================================

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
DROP POLICY IF EXISTS "own_profile" ON profiles;

-- ============================================================================
-- PASO 2: Crear políticas correctas que permitan SELECT, INSERT, UPDATE, DELETE
-- ============================================================================

-- Profiles: Los usuarios pueden ver y actualizar su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Habit Completions
CREATE POLICY "Users can view own habit completions" ON habit_completions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own habit completions" ON habit_completions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own habit completions" ON habit_completions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own habit completions" ON habit_completions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid()::text = user_id);

-- Goals
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid()::text = user_id);

-- Goal Tasks
CREATE POLICY "Users can view own goal tasks" ON goal_tasks
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can insert own goal tasks" ON goal_tasks
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can update own goal tasks" ON goal_tasks
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can delete own goal tasks" ON goal_tasks
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

-- Goal Entries
CREATE POLICY "Users can view own goal entries" ON goal_entries
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can insert own goal entries" ON goal_entries
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can update own goal entries" ON goal_entries
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can delete own goal entries" ON goal_entries
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

-- Goal Numeric Entries
CREATE POLICY "Users can view own goal numeric entries" ON goal_numeric_entries
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can insert own goal numeric entries" ON goal_numeric_entries
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can update own goal numeric entries" ON goal_numeric_entries
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

CREATE POLICY "Users can delete own goal numeric entries" ON goal_numeric_entries
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM goals WHERE id = goal_id));

-- Recipes
CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid()::text = user_id);

-- Meal Plan Entries
CREATE POLICY "Users can view own meal plan entries" ON meal_plan_entries
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own meal plan entries" ON meal_plan_entries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own meal plan entries" ON meal_plan_entries
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own meal plan entries" ON meal_plan_entries
  FOR DELETE USING (auth.uid()::text = user_id);

-- Prepared Meals
CREATE POLICY "Users can view own prepared meals" ON prepared_meals
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own prepared meals" ON prepared_meals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own prepared meals" ON prepared_meals
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own prepared meals" ON prepared_meals
  FOR DELETE USING (auth.uid()::text = user_id);

-- Mood Entries
CREATE POLICY "Users can view own mood entries" ON mood_entries
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own mood entries" ON mood_entries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own mood entries" ON mood_entries
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own mood entries" ON mood_entries
  FOR DELETE USING (auth.uid()::text = user_id);

-- Energy Entries
CREATE POLICY "Users can view own energy entries" ON energy_entries
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own energy entries" ON energy_entries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own energy entries" ON energy_entries
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own energy entries" ON energy_entries
  FOR DELETE USING (auth.uid()::text = user_id);

-- Drink Logs
CREATE POLICY "Users can view own drink logs" ON drink_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own drink logs" ON drink_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own drink logs" ON drink_logs
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own drink logs" ON drink_logs
  FOR DELETE USING (auth.uid()::text = user_id);

-- Exercise Logs
CREATE POLICY "Users can view own exercise logs" ON exercise_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own exercise logs" ON exercise_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own exercise logs" ON exercise_logs
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own exercise logs" ON exercise_logs
  FOR DELETE USING (auth.uid()::text = user_id);

-- Pomodoro Sessions
CREATE POLICY "Users can view own pomodoro sessions" ON pomodoro_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own pomodoro sessions" ON pomodoro_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own pomodoro sessions" ON pomodoro_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own pomodoro sessions" ON pomodoro_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Journal Entries
CREATE POLICY "Users can view own journal entries" ON journal_entries
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own journal entries" ON journal_entries
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own journal entries" ON journal_entries
  FOR DELETE USING (auth.uid()::text = user_id);

-- Negative Habit Logs
CREATE POLICY "Users can view own negative habit logs" ON negative_habit_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own negative habit logs" ON negative_habit_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own negative habit logs" ON negative_habit_logs
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own negative habit logs" ON negative_habit_logs
  FOR DELETE USING (auth.uid()::text = user_id);

-- Shopping Items
CREATE POLICY "Users can view own shopping items" ON shopping_items
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own shopping items" ON shopping_items
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own shopping items" ON shopping_items
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own shopping items" ON shopping_items
  FOR DELETE USING (auth.uid()::text = user_id);

COMMIT;

-- ============================================================================
-- PASO 3: Verificar que las políticas se crearon correctamente
-- ============================================================================

SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
