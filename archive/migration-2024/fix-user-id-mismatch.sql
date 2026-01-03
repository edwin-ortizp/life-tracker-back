-- Script para actualizar el user_id de todos los datos importados
-- Reemplaza '<NEW-UUID>' con el UUID real del nuevo usuario
--
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → Authentication → Users
-- 2. Copia el UUID del usuario que creaste (el que tiene tu email)
-- 3. Reemplaza TODAS las apariciones de '<NEW-UUID>' con ese UUID
-- 4. Ejecuta este script en Supabase SQL Editor
--
-- IMPORTANTE: Este script actualiza PRIMERO las tablas hijas (para evitar errores de foreign key)
-- y DESPUÉS actualiza la tabla profiles.

BEGIN;

-- ============================================================================
-- PASO 1: Actualizar tablas hijas (que referencian a profiles via user_id)
-- ============================================================================

-- Actualizar habit_completions (1,681 registros)
UPDATE habit_completions
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar tasks (555 registros)
UPDATE tasks
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar goals (25 registros)
UPDATE goals
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar mood_entries (272 registros)
UPDATE mood_entries
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar energy_entries
UPDATE energy_entries
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar drink_logs
UPDATE drink_logs
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar exercise_logs
UPDATE exercise_logs
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar pomodoro_sessions
UPDATE pomodoro_sessions
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar journal_entries (194 registros)
UPDATE journal_entries
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar negative_habit_logs
UPDATE negative_habit_logs
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar recipes
UPDATE recipes
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar meal_plan_entries
UPDATE meal_plan_entries
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar prepared_meals
UPDATE prepared_meals
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- Actualizar shopping_items
UPDATE shopping_items
SET user_id = '<NEW-UUID>'
WHERE user_id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

-- ============================================================================
-- PASO 2: Actualizar profiles (después de todas las tablas hijas)
-- ============================================================================

UPDATE profiles
SET id = '<NEW-UUID>'
WHERE id = 'HPiS7rrqvKVm9uZBV8sHzW8wQz33';

COMMIT;

-- ============================================================================
-- Verificación: Contar registros actualizados
-- ============================================================================

SELECT 'profiles' as table_name, COUNT(*) as count
FROM profiles
WHERE id = '<NEW-UUID>'

UNION ALL

SELECT 'habit_completions', COUNT(*)
FROM habit_completions
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'tasks', COUNT(*)
FROM tasks
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'goals', COUNT(*)
FROM goals
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'mood_entries', COUNT(*)
FROM mood_entries
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'energy_entries', COUNT(*)
FROM energy_entries
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'drink_logs', COUNT(*)
FROM drink_logs
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'exercise_logs', COUNT(*)
FROM exercise_logs
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'pomodoro_sessions', COUNT(*)
FROM pomodoro_sessions
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'journal_entries', COUNT(*)
FROM journal_entries
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'negative_habit_logs', COUNT(*)
FROM negative_habit_logs
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'recipes', COUNT(*)
FROM recipes
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'meal_plan_entries', COUNT(*)
FROM meal_plan_entries
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'prepared_meals', COUNT(*)
FROM prepared_meals
WHERE user_id = '<NEW-UUID>'

UNION ALL

SELECT 'shopping_items', COUNT(*)
FROM shopping_items
WHERE user_id = '<NEW-UUID>';
