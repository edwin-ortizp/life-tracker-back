-- ============================================================================
-- MIGRATION: Unify goal_tasks into tasks table
-- Date: 2026-01-03
-- Description: Migrates all tasks from goal_tasks table to tasks table using
--              the existing goal_id field, then drops goal_tasks table
-- ============================================================================

-- Migrar goal_tasks → tasks con valores por defecto
INSERT INTO tasks (
  user_id,
  goal_id,
  task_code,
  title,
  description,
  completed,
  category,
  priority,
  size,
  start_date,
  end_date,
  is_recurrent,
  is_private,
  progress,
  elapsed_seconds,
  created_at,
  updated_at
)
SELECT
  g.user_id,
  gt.goal_id,
  NULL,                                        -- task_code se genera después
  gt.title,
  NULL,
  gt.done,
  'personal',                                  -- default category
  'delete',                                    -- default priority (low urgency/importance)
  'pequeña',                                  -- default size
  NULL,
  NULL,
  false,
  false,
  CASE WHEN gt.done THEN 100 ELSE 0 END,
  0,
  gt.created_at,
  COALESCE(gt.completed_at, gt.created_at)
FROM goal_tasks gt
INNER JOIN goals g ON gt.goal_id = g.id
ORDER BY gt.created_at ASC;

-- Generar task_code para tareas migradas
-- Esto asigna códigos secuenciales únicos para cada usuario
DO $$
DECLARE
  user_record RECORD;
  task_record RECORD;
  next_code INTEGER;
BEGIN
  FOR user_record IN
    SELECT DISTINCT user_id FROM tasks WHERE task_code IS NULL
  LOOP
    -- Obtener el task_code más alto existente para este usuario
    SELECT COALESCE(MAX(task_code), 9999) INTO next_code
    FROM tasks
    WHERE user_id = user_record.user_id AND task_code IS NOT NULL;

    -- Asignar códigos secuenciales a las tareas migradas
    FOR task_record IN
      SELECT id FROM tasks
      WHERE user_id = user_record.user_id AND task_code IS NULL
      ORDER BY created_at ASC
    LOOP
      next_code := next_code + 1;
      UPDATE tasks SET task_code = next_code WHERE id = task_record.id;
    END LOOP;
  END LOOP;
END $$;

-- Crear índice para goal_id
-- Mejora el performance de queries que filtran por goal_id
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id)
  WHERE goal_id IS NOT NULL;

-- Verificar migración
-- Esto asegura que todos los registros se migraron correctamente antes de eliminar goal_tasks
DO $$
DECLARE
  goal_tasks_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO goal_tasks_count FROM goal_tasks;
  SELECT COUNT(*) INTO migrated_count FROM tasks WHERE goal_id IS NOT NULL;

  RAISE NOTICE '======================================';
  RAISE NOTICE 'Resumen de Migración:';
  RAISE NOTICE '  goal_tasks originales: %', goal_tasks_count;
  RAISE NOTICE '  Tareas migradas a tasks: %', migrated_count;
  RAISE NOTICE '======================================';

  IF goal_tasks_count != migrated_count THEN
    RAISE EXCEPTION 'Error: migración incompleta. Se esperaban % registros pero se migraron %',
      goal_tasks_count, migrated_count;
  ELSE
    RAISE NOTICE 'Migración exitosa - Todos los registros migrados correctamente';
  END IF;
END $$;

-- Eliminar goal_tasks table y objetos relacionados
-- Solo se ejecuta si la verificación anterior fue exitosa
DROP TABLE IF EXISTS goal_tasks CASCADE;

RAISE NOTICE '======================================';
RAISE NOTICE 'Tabla goal_tasks eliminada exitosamente';
RAISE NOTICE 'Migración completada';
RAISE NOTICE '======================================';
