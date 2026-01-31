-- ============================================================================
-- RECIPE INGREDIENTS TABLE (Relación recetas - shopping items)
-- ============================================================================

CREATE TABLE recipe_ingredients (
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  shopping_item_id TEXT REFERENCES shopping_items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (recipe_id, shopping_item_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_item ON recipe_ingredients(shopping_item_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Nota: Las políticas RLS se definen en 020_fix_rls_auth_uid.sql

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE recipe_ingredients IS 'Relación muchos-a-muchos entre recetas y shopping items';
COMMENT ON COLUMN recipe_ingredients.quantity IS 'Cantidad del ingrediente necesaria para la receta';
COMMENT ON COLUMN recipe_ingredients.unit IS 'Unidad de medida (puede ser diferente a la del shopping_item). Ej: "tazas", "cucharadas", "al gusto"';
COMMENT ON COLUMN recipe_ingredients.notes IS 'Notas adicionales. Ej: "picado finamente", "rallado", "opcional"';
