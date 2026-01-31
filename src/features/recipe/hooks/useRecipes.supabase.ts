import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Recipe } from '../types';

export const useRecipes = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Cargar recetas del usuario
  const loadRecipes = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const list: Recipe[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        instructions: row.instructions || '',
        nutrition: row.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        mealType: row.meal_type,
        ...(row.description && { description: row.description }),
        ...(row.difficulty && { difficulty: row.difficulty }),
        ...(row.prep_time !== undefined && { prepTime: row.prep_time }),
        ...(row.favorite !== undefined && { favorite: row.favorite })
      }));

      setRecipes(list);
      setStatus('idle');
    } catch (error) {
      console.error('Error loading recipes:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar recetas');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      return;
    }
    loadRecipes();
  }, [user, loadRecipes]);

  const addRecipe = async (recipe: Omit<Recipe, 'id'>): Promise<string | null> => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    setStatus('saving');
    setError(null);

    // Crear receta optimistically
    const optimisticRecipe: Recipe = {
      id: `temp-${Date.now()}`,
      ...recipe
    };

    setRecipes(prev => [...prev, optimisticRecipe]);

    try {
      const { data, error: insertError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: recipe.name,
          instructions: recipe.instructions,
          nutrition: recipe.nutrition,
          meal_type: recipe.mealType,
          description: recipe.description || null,
          difficulty: recipe.difficulty || null,
          prep_time: recipe.prepTime || null,
          favorite: recipe.favorite || false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Actualizar con el ID real
      setRecipes(prev => prev.map(r =>
        r.id === optimisticRecipe.id
          ? { ...r, id: data.id }
          : r
      ));

      setStatus('idle');
      return data.id; // Retornar el ID de la receta creada
    } catch (e) {
      console.error('Error adding recipe:', e);
      // Revertir actualización optimista
      setRecipes(prev => prev.filter(r => r.id !== optimisticRecipe.id));
      setError(e instanceof Error ? e.message : 'Error al guardar');
      setStatus('error');
      return null;
    }
  };

  const updateRecipe = async (id: string, data: Partial<Recipe>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    const originalRecipe = recipes.find(r => r.id === id);
    if (!originalRecipe) return;

    try {
      // Actualización optimista
      const updatedRecipe: Recipe = {
        ...originalRecipe,
        ...data
      };

      setRecipes(prev => prev.map(r =>
        r.id === id ? updatedRecipe : r
      ));

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.instructions !== undefined) updateData.instructions = data.instructions;
      if (data.nutrition !== undefined) updateData.nutrition = data.nutrition;
      if (data.mealType !== undefined) updateData.meal_type = data.mealType;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
      if (data.prepTime !== undefined) updateData.prep_time = data.prepTime;
      if (data.favorite !== undefined) updateData.favorite = data.favorite;

      const { error: updateError } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      setStatus('idle');
    } catch (e) {
      console.error('Error updating recipe:', e);
      // Revertir actualización optimista
      setRecipes(prev => prev.map(r =>
        r.id === id ? originalRecipe : r
      ));
      setError(e instanceof Error ? e.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    const recipeToDelete = recipes.find(r => r.id === id);
    if (!recipeToDelete) return;

    try {
      // Actualización optimista
      setRecipes(prev => prev.filter(r => r.id !== id));

      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setStatus('idle');
    } catch (e) {
      console.error('Error deleting recipe:', e);
      // Revertir actualización optimista
      setRecipes(prev => [...prev, recipeToDelete]);
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  return { recipes, status, error, addRecipe, updateRecipe, deleteRecipe, loadRecipes };
};
