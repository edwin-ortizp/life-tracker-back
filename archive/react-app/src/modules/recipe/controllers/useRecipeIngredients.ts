import { useState, useCallback, useEffect } from 'react';
import { RecipeService } from '@/modules/recipe/services';
import type { RecipeIngredientRelation, RecipeIngredientWithItem } from '../models';
import { useAuth } from '@/shared/hooks/useAuth';


export const useRecipeIngredients = (recipeId?: string) => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<RecipeIngredientWithItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadIngredients = useCallback(async () => {
    if (!recipeId || !user) {
      setIngredients([]);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const { data, error: fetchError } = await RecipeService.table('recipe_ingredients')
        .select(`
          *,
          shopping_item:shopping_items(*)
        `)
        .eq('recipe_id', recipeId);

      if (fetchError) throw fetchError;

      const ingredientsList: RecipeIngredientWithItem[] = (data || []).map((row: any) => ({
        recipeId: row.recipe_id,
        shoppingItemId: row.shopping_item_id,
        quantity: Number(row.quantity),
        unit: row.unit || undefined,
        notes: row.notes || undefined,
        shoppingItem: {
          id: row.shopping_item.id,
          name: row.shopping_item.name,
          stock: row.shopping_item.stock,
          toBuy: row.shopping_item.to_buy,
          status: row.shopping_item.status,
          price: row.shopping_item.price,
          category: row.shopping_item.category,
          place: row.shopping_item.place,
          consumeBy: row.shopping_item.consume_by,
          nextPurchase: row.shopping_item.next_purchase,
          unit: row.shopping_item.unit,
          barcode: row.shopping_item.barcode
        }
      }));

      setIngredients(ingredientsList);
      setStatus('idle');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al cargar ingredientes');
      setStatus('error');
      setIngredients([]);
    }
  }, [recipeId, user]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const addIngredient = async (ingredient: Omit<RecipeIngredientRelation, 'recipeId'>) => {
    if (!recipeId || !user) {
      setError('Receta no especificada');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const docData = {
        recipe_id: recipeId,
        shopping_item_id: ingredient.shoppingItemId,
        quantity: ingredient.quantity,
        ...(ingredient.unit && { unit: ingredient.unit }),
        ...(ingredient.notes && { notes: ingredient.notes })
      };

      const { error: insertError } = await RecipeService.table('recipe_ingredients')
        .insert(docData);

      if (insertError) throw insertError;

      await loadIngredients();
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al guardar ingrediente';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const updateIngredient = async (
    shoppingItemId: string,
    data: Partial<Omit<RecipeIngredientRelation, 'recipeId' | 'shoppingItemId'>>
  ) => {
    if (!recipeId || !user) {
      setError('Receta no especificada');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const updateData: any = {};

      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.unit !== undefined) updateData.unit = data.unit || null;
      if (data.notes !== undefined) updateData.notes = data.notes || null;

      const { error: updateError } = await RecipeService.table('recipe_ingredients')
        .update(updateData)
        .eq('recipe_id', recipeId)
        .eq('shopping_item_id', shoppingItemId);

      if (updateError) throw updateError;

      await loadIngredients();
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al actualizar ingrediente';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const deleteIngredient = async (shoppingItemId: string) => {
    if (!recipeId || !user) {
      setError('Receta no especificada');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const { error: deleteError } = await RecipeService.table('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('shopping_item_id', shoppingItemId);

      if (deleteError) throw deleteError;

      await loadIngredients();
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al eliminar ingrediente';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const replaceAllIngredients = async (ingredientsList: Omit<RecipeIngredientRelation, 'recipeId'>[]) => {
    if (!recipeId || !user) {
      setError('Receta no especificada');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      // Eliminar todos los ingredientes existentes
      const { error: deleteError } = await RecipeService.table('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      if (deleteError) throw deleteError;

      // Insertar los nuevos ingredientes
      if (ingredientsList.length > 0) {
        const docData = ingredientsList.map(ing => ({
          recipe_id: recipeId,
          shopping_item_id: ing.shoppingItemId,
          quantity: ing.quantity,
          ...(ing.unit && { unit: ing.unit }),
          ...(ing.notes && { notes: ing.notes })
        }));

        const { error: insertError } = await RecipeService.table('recipe_ingredients')
          .insert(docData);

        if (insertError) throw insertError;
      }

      await loadIngredients();
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al actualizar ingredientes';
      setError(errorMessage);
      setStatus('error');
    }
  };

  return {
    ingredients,
    status,
    error,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    replaceAllIngredients,
    loadIngredients
  };
};
