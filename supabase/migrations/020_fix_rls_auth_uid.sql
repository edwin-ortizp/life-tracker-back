-- ============================================================================
-- FIX RLS POLICIES TO USE auth.uid() INSTEAD OF current_setting
-- ============================================================================
-- Supabase recomienda usar auth.uid() en lugar de current_setting
-- para acceder al usuario autenticado en las políticas RLS
-- ============================================================================

-- 1. RECIPES - Actualizar políticas para usar auth.uid()
DROP POLICY IF EXISTS "select_own_recipes" ON recipes;
DROP POLICY IF EXISTS "insert_own_recipes" ON recipes;
DROP POLICY IF EXISTS "update_own_recipes" ON recipes;
DROP POLICY IF EXISTS "delete_own_recipes" ON recipes;

CREATE POLICY "select_own_recipes" ON recipes
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "insert_own_recipes" ON recipes
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "update_own_recipes" ON recipes
  FOR UPDATE USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "delete_own_recipes" ON recipes
  FOR DELETE USING (user_id = auth.uid()::text);

-- 2. RECIPE_INGREDIENTS - Actualizar políticas para usar auth.uid()
DROP POLICY IF EXISTS "select_own_recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "insert_own_recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "update_own_recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "delete_own_recipe_ingredients" ON recipe_ingredients;

CREATE POLICY "select_own_recipe_ingredients" ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()::text
    )
  );

CREATE POLICY "insert_own_recipe_ingredients" ON recipe_ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()::text
    )
  );

CREATE POLICY "update_own_recipe_ingredients" ON recipe_ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()::text
    )
  );

CREATE POLICY "delete_own_recipe_ingredients" ON recipe_ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()::text
    )
  );
