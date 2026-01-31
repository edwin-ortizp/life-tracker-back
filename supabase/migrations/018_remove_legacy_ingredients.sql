-- ============================================================================
-- REMOVE LEGACY INGREDIENTS COLUMN
-- ============================================================================
-- Elimina la columna JSONB ingredients que ya no se usa.
-- Los ingredientes ahora se manejan a través de la tabla recipe_ingredients.
-- ============================================================================

ALTER TABLE recipes DROP COLUMN IF EXISTS ingredients;
