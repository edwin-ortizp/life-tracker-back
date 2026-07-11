import { useEffect, useState, useCallback } from 'react';
import { PreparedMealsService } from '@/modules/prepared-meals/services';
import { useAuth } from '@/shared/hooks/useAuth';
import type { PreparedMeal } from '../models';


export const usePreparedMeals = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<PreparedMeal[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Cargar comidas preparadas del usuario
  const loadMeals = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      const { data, error: fetchError } = await PreparedMealsService.table('prepared_meals')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const list: PreparedMeal[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name || '',
        ...(row.portions !== undefined && { portions: row.portions })
      }));

      setMeals(list);
      setStatus('idle');
    } catch (error) {
      console.error('Error loading prepared meals:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar comidas');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setMeals([]);
      return;
    }
    loadMeals();
  }, [user, loadMeals]);

  const addMeal = async (meal: Omit<PreparedMeal, 'id'>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    // Crear comida optimistically
    const optimisticMeal: PreparedMeal = {
      id: `temp-${Date.now()}`,
      ...meal
    };

    setMeals(prev => [...prev, optimisticMeal]);

    try {
      const { data, error: insertError } = await PreparedMealsService.table('prepared_meals')
        .insert({
          user_id: user.id,
          name: meal.name,
          portions: meal.portions || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Actualizar con el ID real
      setMeals(prev => prev.map(m =>
        m.id === optimisticMeal.id
          ? { ...m, id: data.id }
          : m
      ));

      setStatus('idle');
    } catch (e) {
      console.error('Error adding prepared meal:', e);
      // Revertir actualización optimista
      setMeals(prev => prev.filter(m => m.id !== optimisticMeal.id));
      const errorMessage = e instanceof Error ? e.message : 'Error al guardar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const updateMeal = async (id: string, data: Partial<PreparedMeal>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    const originalMeal = meals.find(m => m.id === id);
    if (!originalMeal) return;

    try {
      // Actualización optimista
      const updatedMeal: PreparedMeal = {
        ...originalMeal,
        ...data
      };

      setMeals(prev => prev.map(m =>
        m.id === id ? updatedMeal : m
      ));

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.portions !== undefined) updateData.portions = data.portions;

      const { error: updateError } = await PreparedMealsService.table('prepared_meals')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      setStatus('idle');
    } catch (e) {
      console.error('Error updating prepared meal:', e);
      // Revertir actualización optimista
      setMeals(prev => prev.map(m =>
        m.id === id ? originalMeal : m
      ));
      const errorMessage = e instanceof Error ? e.message : 'Error al actualizar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const deleteMeal = async (id: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    const mealToDelete = meals.find(m => m.id === id);
    if (!mealToDelete) return;

    try {
      // Actualización optimista
      setMeals(prev => prev.filter(m => m.id !== id));

      const { error: deleteError } = await PreparedMealsService.table('prepared_meals')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setStatus('idle');
    } catch (e) {
      console.error('Error deleting prepared meal:', e);
      // Revertir actualización optimista
      setMeals(prev => [...prev, mealToDelete]);
      const errorMessage = e instanceof Error ? e.message : 'Error al eliminar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  return { meals, status, error, addMeal, updateMeal, deleteMeal, loadMeals };
};
