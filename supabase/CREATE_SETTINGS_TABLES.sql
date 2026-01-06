-- ============================================================================
-- Agregar columnas faltantes a profiles y crear module_settings
-- ============================================================================

-- PASO 1: Agregar columnas birth_date y theme a profiles
-- (profiles ya tiene: id, email, full_name, avatar_url, created_at, updated_at)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_date TEXT,
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';

-- PASO 2: Crear tabla module_settings
-- Almacena configuración específica de cada módulo (exercise, water, mood, pomodoro, etc.)
-- Cada módulo puede guardar sus propias configuraciones en formato JSON flexible
CREATE TABLE IF NOT EXISTS module_settings (
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  module TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, module)
);

-- Habilitar RLS en module_settings
ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver/editar configuraciones de sus propios módulos
CREATE POLICY "own_module_settings" ON module_settings
  FOR ALL
  USING (auth.uid()::TEXT = user_id);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_module_settings_user ON module_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_module_settings_module ON module_settings(user_id, module);

-- PASO 3: Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Crear trigger para updated_at en module_settings
DROP TRIGGER IF EXISTS update_module_settings_updated_at ON module_settings;
CREATE TRIGGER update_module_settings_updated_at
  BEFORE UPDATE ON module_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migración completada
-- ============================================================================
-- RESUMEN:
-- ✅ profiles ahora tiene: birth_date, theme
-- ✅ module_settings creada para configuraciones de módulos (JSONB flexible)
-- ============================================================================
