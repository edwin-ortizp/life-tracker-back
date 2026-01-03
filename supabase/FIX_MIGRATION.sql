-- ============================================================================
-- FIX: Migración corregida con tipos de datos apropiados
-- Este script detecta el tipo de profiles.id y ajusta las tablas
-- ============================================================================

-- PASO 1: Verificar tipo de profiles.id
DO $$
DECLARE
  profile_id_type TEXT;
BEGIN
  SELECT data_type INTO profile_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'id';

  RAISE NOTICE 'El tipo de profiles.id es: %', profile_id_type;
END $$;

-- PASO 2: Eliminar tablas si existen (para recrearlas con tipos correctos)
DROP TABLE IF EXISTS exercise_types CASCADE;
DROP TABLE IF EXISTS drink_types CASCADE;
DROP TABLE IF EXISTS mood_states CASCADE;

-- PASO 3: Recrear exercise_types con TEXT (compatible con auth.users)
CREATE TABLE exercise_types (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  calories_per_hour INTEGER NOT NULL DEFAULT 0,
  steps_equivalent INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  icon TEXT,
  legacy_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE exercise_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_exercise_types" ON exercise_types FOR ALL USING (auth.uid()::TEXT = user_id);
CREATE INDEX idx_exercise_types_user ON exercise_types(user_id);
CREATE INDEX idx_exercise_types_legacy ON exercise_types(user_id, legacy_id);

-- PASO 4: Recrear drink_types con TEXT
CREATE TABLE drink_types (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  hydration_factor NUMERIC(3,2) CHECK (hydration_factor >= 0 AND hydration_factor <= 1) NOT NULL DEFAULT 1.0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Droplet',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE drink_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_drink_types" ON drink_types FOR ALL USING (auth.uid()::TEXT = user_id);
CREATE INDEX idx_drink_types_user ON drink_types(user_id);

-- PASO 5: Recrear mood_states con TEXT
CREATE TABLE mood_states (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  text TEXT NOT NULL,
  value INTEGER CHECK (value BETWEEN 1 AND 10) NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, text)
);

ALTER TABLE mood_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_mood_states" ON mood_states FOR ALL USING (auth.uid()::TEXT = user_id);
CREATE INDEX idx_mood_states_user ON mood_states(user_id);
CREATE INDEX idx_mood_states_user_value ON mood_states(user_id, value);

-- PASO 6: Poblar con datos por defecto
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM profiles LOOP
    -- Ejercicios
    INSERT INTO exercise_types (user_id, name, calories_per_hour, steps_equivalent, category, icon, legacy_id) VALUES
    (user_record.id, 'Pasos', 200, 1312, 'cardio', '👣', 1),
    (user_record.id, 'Trotar', 500, 1200, 'cardio', '🏃', 2),
    (user_record.id, 'Bicicleta', 450, 0, 'cardio', '🚲', 3),
    (user_record.id, 'Caminata', 250, 1400, 'cardio', '🚶', 4),
    (user_record.id, 'Natación', 550, 0, 'cardio', '🏊', 5),
    (user_record.id, 'Tenis', 500, 0, 'cardio', '🎾', 6),
    (user_record.id, 'Abdominales', 300, 0, 'strength', '💪', 7),
    (user_record.id, 'Pesas de mano', 250, 0, 'strength', '🏋️', 8),
    (user_record.id, 'Flexiones', 350, 0, 'strength', '💪', 9),
    (user_record.id, 'Sentadillas', 400, 0, 'strength', '🏋️', 10),
    (user_record.id, 'Burpees', 700, 0, 'strength', '💥', 11),
    (user_record.id, 'Yoga', 250, 0, 'flexibility', '🧘', 12),
    (user_record.id, 'Estiramientos', 150, 0, 'flexibility', '🤸', 13)
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Bebidas (EXACTAMENTE las del código actual)
    INSERT INTO drink_types (user_id, name, hydration_factor, color, icon, category) VALUES
    (user_record.id, 'Agua', 1.0, '#3b82f6', 'Droplet', 'water'),
    (user_record.id, 'Café', 0.7, '#78350f', 'Coffee', 'coffee'),
    (user_record.id, 'Té', 0.85, '#84cc16', 'Coffee', 'tea'),
    (user_record.id, 'Jugo', 0.8, '#f97316', 'Apple', 'juice'),
    (user_record.id, 'Gaseosa', 0.5, '#a3a3a3', 'Wine', 'soda'),
    (user_record.id, 'Leche', 0.85, '#e5e5e5', 'Milk', 'milk'),
    (user_record.id, 'Bebida Deportiva', 0.9, '#06b6d4', 'Zap', 'sports'),
    (user_record.id, 'Cerveza', 0.6, '#fbbf24', 'Beer', 'beer'),
    (user_record.id, 'Vino', 0.5, '#dc2626', 'Wine', 'wine'),
    (user_record.id, 'Batido', 0.8, '#ec4899', 'Cup', 'smoothie')
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Estados de ánimo
    INSERT INTO mood_states (user_id, emoji, text, value, category) VALUES
    (user_record.id, '😍', 'Enamorado', 10, 'Emocional'),
    (user_record.id, '😊', 'Feliz', 10, 'Emocional'),
    (user_record.id, '🌟', 'Energético', 10, 'Físico'),
    (user_record.id, '🧠', 'Productivo', 10, 'Mental'),
    (user_record.id, '😎', 'Confiado', 9, 'Mental'),
    (user_record.id, '😌', 'Tranquilo', 8, 'Emocional'),
    (user_record.id, '🤔', 'Pensativo', 6, 'Mental'),
    (user_record.id, '🥱', 'Aburrido', 5, 'Emocional'),
    (user_record.id, '😴', 'Pereza', 4, 'Físico'),
    (user_record.id, '😕', 'Confundido', 5, 'Mental'),
    (user_record.id, '😬', 'Nervioso', 3, 'Emocional'),
    (user_record.id, '🤯', 'Abrumado', 3, 'Mental'),
    (user_record.id, '😤', 'Frustración', 3, 'Emocional'),
    (user_record.id, '😰', 'Ansioso', 2, 'Emocional'),
    (user_record.id, '😪', 'Cansado', 2, 'Físico'),
    (user_record.id, '😢', 'Triste', 1, 'Emocional'),
    (user_record.id, '😡', 'Enojado', 1, 'Emocional'),
    (user_record.id, '🤒', 'Enfermo', 1, 'Físico')
    ON CONFLICT (user_id, text) DO NOTHING;
  END LOOP;
END $$;

-- PASO 7: Agregar columnas de migración a tablas existentes
ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS exercise_type_id TEXT REFERENCES exercise_types(id);
ALTER TABLE drink_logs ADD COLUMN IF NOT EXISTS drink_type_id TEXT REFERENCES drink_types(id);
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS mood_state_id TEXT REFERENCES mood_states(id);

-- PASO 8: Migrar datos existentes
UPDATE exercise_logs el
SET exercise_type_id = et.id
FROM exercise_types et
WHERE el.user_id = et.user_id
  AND et.legacy_id = el.exercise_id
  AND el.exercise_type_id IS NULL;

UPDATE drink_logs dl
SET drink_type_id = dt.id
FROM drink_types dt
WHERE dl.user_id = dt.user_id
  AND dl.drink_type = dt.name
  AND dl.drink_type_id IS NULL;

UPDATE mood_entries me
SET mood_state_id = ms.id
FROM mood_states ms
WHERE me.user_id = ms.user_id
  AND me.text = ms.text
  AND me.mood_state_id IS NULL;

-- PASO 9: Resumen
DO $$
DECLARE
  total_users INTEGER;
  total_exercise_types INTEGER;
  total_drink_types INTEGER;
  total_mood_states INTEGER;
  total_exercise_logs INTEGER;
  migrated_exercise_logs INTEGER;
  total_drink_logs INTEGER;
  migrated_drink_logs INTEGER;
  total_mood_entries INTEGER;
  migrated_mood_entries INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO total_exercise_types FROM exercise_types;
  SELECT COUNT(*) INTO total_drink_types FROM drink_types;
  SELECT COUNT(*) INTO total_mood_states FROM mood_states;
  SELECT COUNT(*) INTO total_exercise_logs FROM exercise_logs;
  SELECT COUNT(*) INTO migrated_exercise_logs FROM exercise_logs WHERE exercise_type_id IS NOT NULL;
  SELECT COUNT(*) INTO total_drink_logs FROM drink_logs;
  SELECT COUNT(*) INTO migrated_drink_logs FROM drink_logs WHERE drink_type_id IS NOT NULL;
  SELECT COUNT(*) INTO total_mood_entries FROM mood_entries;
  SELECT COUNT(*) INTO migrated_mood_entries FROM mood_entries WHERE mood_state_id IS NOT NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: %', total_users;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Exercise Types: % (expected: %)', total_exercise_types, total_users * 13;
  RAISE NOTICE 'Exercise Logs: % / % migrated (%.1f%%)',
    migrated_exercise_logs, total_exercise_logs,
    CASE WHEN total_exercise_logs > 0 THEN (migrated_exercise_logs::float / total_exercise_logs * 100) ELSE 0 END;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Drink Types: % (expected: %)', total_drink_types, total_users * 10;
  RAISE NOTICE 'Drink Logs: % / % migrated (%.1f%%)',
    migrated_drink_logs, total_drink_logs,
    CASE WHEN total_drink_logs > 0 THEN (migrated_drink_logs::float / total_drink_logs * 100) ELSE 0 END;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Mood States: % (expected: %)', total_mood_states, total_users * 18;
  RAISE NOTICE 'Mood Entries: % / % migrated (%.1f%%)',
    migrated_mood_entries, total_mood_entries,
    CASE WHEN total_mood_entries > 0 THEN (migrated_mood_entries::float / total_mood_entries * 100) ELSE 0 END;
  RAISE NOTICE '========================================';
END $$;
