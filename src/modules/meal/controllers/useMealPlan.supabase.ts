import { useState, useEffect, useCallback } from 'react';
import { MealService } from '@/modules/meal/services';
import { useAuth } from '@/shared/hooks/useAuth';
import { MealPlan, Meal, MealPlanEntry} from '../models';


type MealPlanStatus = 'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error';

export const useMealPlan = () => {
  const [monthlyMealPlans, setMonthlyMealPlans] = useState<Record<string, MealPlan>>({});
  const [status, setStatus] = useState<MealPlanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Combine all monthly meal plans into a single object for the UI
  const mealPlan: MealPlan = Object.values(monthlyMealPlans).reduce((acc, monthPlan) => ({
    ...acc,
    ...monthPlan
  }), {});

  // Cargar planes de comida (carga inicial única)
  const loadMealPlans = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      const visibleMonths = getVisibleMonths();

      // Cargar todas las comidas de los meses visibles
      const { data, error: fetchError } = await MealService.table('meal_plan_entries')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Transformar a formato esperado por UI
      const newMonthlyMealPlans: Record<string, MealPlan> = {};

      // Inicializar meses visibles
      visibleMonths.forEach(month => {
        newMonthlyMealPlans[month] = {};
      });

      // Agrupar por fecha y tipo de comida
      (data || []).forEach((row: any) => {
        const date = row.date;
        const [year, month] = date.split('-');
        const yearMonth = `${year}-${month}`;

        if (!newMonthlyMealPlans[yearMonth]) {
          newMonthlyMealPlans[yearMonth] = {};
        }

        if (!newMonthlyMealPlans[yearMonth][date]) {
          newMonthlyMealPlans[yearMonth][date] = {};
        }

        const mealId = `${date}_${row.meal_type}`;
        newMonthlyMealPlans[yearMonth][date][row.meal_type] = {
          id: mealId,
          type: row.meal_type as Meal['type'],
          name: row.name || '',
          notes: row.notes,
          calories: row.calories,
          recipe: row.recipe_id
        };
      });

      setMonthlyMealPlans(newMonthlyMealPlans);
      setStatus('saved');

      if (import.meta.env.DEV) {
        console.log('Meal plans loaded for months:', Object.keys(newMonthlyMealPlans));
      }
    } catch (error) {
      console.error('Error loading meal plans:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar el plan');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    loadMealPlans();
  }, [loadMealPlans]);

  const addMeal = useCallback(async (date: string, type: Meal['type'], meal: Omit<Meal, 'id'>) => {
    if (!user) return;

    // Validación de campo obligatorio
    if (!meal.name || meal.name.trim() === '') {
      throw new Error('El nombre de la comida es obligatorio');
    }

    setStatus('saving');
    setError(null);

    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;
    const mealId = `${date}_${type}`;

    // Guardar estado original para revertir si falla
    const originalMonthPlan = monthlyMealPlans[yearMonth] || {};

    try {
      // Actualización optimista
      const newMealPlan = {
        ...originalMonthPlan,
        [date]: {
          ...originalMonthPlan[date],
          [type]: {
            id: mealId,
            ...meal,
            calories: meal.calories
          }
        }
      };

      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: newMealPlan
      }));

      // Insertar en Supabase
      const { error: insertError } = await MealService.table('meal_plan_entries')
        .upsert({
          user_id: user.id,
          date: date,
          meal_type: type,
          name: meal.name.trim(),
          notes: meal.notes,
          calories: meal.calories ? Number(meal.calories) : null,
          recipe_id: meal.recipe || null
        }, {
          onConflict: 'user_id,date,meal_type'
        });

      if (insertError) throw insertError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Meal added for date:', date, 'type:', type);
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      // Revertir actualización optimista
      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: originalMonthPlan
      }));
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
      throw error;
    }
  }, [user, monthlyMealPlans]);

  const removeMeal = useCallback(async (date: string, type: Meal['type']) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;

    // Guardar estado original para revertir si falla
    const originalMonthPlan = monthlyMealPlans[yearMonth] || {};

    try {
      // Actualización optimista
      const currentMonthMeals = JSON.parse(JSON.stringify(originalMonthPlan));

      if (currentMonthMeals[date]) {
        const updatedDayMeals = { ...currentMonthMeals[date] };
        delete updatedDayMeals[type];

        if (Object.keys(updatedDayMeals).length === 0) {
          delete currentMonthMeals[date];
        } else {
          currentMonthMeals[date] = updatedDayMeals;
        }
      }

      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: currentMonthMeals
      }));

      // Eliminar de Supabase
      const { error: deleteError } = await MealService.table('meal_plan_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('meal_type', type);

      if (deleteError) throw deleteError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Meal removed for date:', date, 'type:', type);
      }
    } catch (error) {
      console.error('Error removing meal:', error);
      // Revertir actualización optimista
      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: originalMonthPlan
      }));
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
      throw error;
    }
  }, [user, monthlyMealPlans]);

  const importMealPlan = useCallback(async (newMealPlan: MealPlan) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    // Guardar estado original para revertir si falla
    const originalMonthlyMealPlans = monthlyMealPlans;

    try {
      // Preparar datos para inserción
      const mealEntries: any[] = [];

      Object.entries(newMealPlan).forEach(([date, meals]) => {
        Object.entries(meals).forEach(([type, meal]) => {
          // Validar que el nombre exista
          if (!meal.name || meal.name.trim() === '') {
            console.warn(`Skipping meal without name for ${date} ${type}`);
            return;
          }

          mealEntries.push({
            user_id: user.id,
            date: date,
            meal_type: type,
            name: meal.name.trim(),
            notes: meal.notes || null,
            calories: meal.calories ? Number(meal.calories) : null,
            recipe_id: meal.recipe || null
          });
        });
      });

      // Actualización optimista - agrupar por mes
      const mealsByMonth = Object.entries(newMealPlan).reduce((acc, [date, meals]) => {
        const [year, month] = date.split('-');
        const yearMonth = `${year}-${month}`;

        if (!acc[yearMonth]) {
          acc[yearMonth] = {};
        }

        acc[yearMonth][date] = Object.entries(meals).reduce((mealAcc, [type, meal]) => {
          if (!meal.name || meal.name.trim() === '') return mealAcc;

          const mealId = `${date}_${type}`;
          mealAcc[type] = {
            ...meal,
            id: mealId,
            type: type as Meal['type'],
            name: meal.name.trim(),
            calories: meal.calories ? Number(meal.calories) : undefined
          };
          return mealAcc;
        }, {} as MealPlanEntry);

        return acc;
      }, {} as Record<string, MealPlan>);

      setMonthlyMealPlans(prev => ({
        ...prev,
        ...mealsByMonth
      }));

      // Insertar en batch
      const { error: insertError } = await MealService.table('meal_plan_entries')
        .upsert(mealEntries, {
          onConflict: 'user_id,date,meal_type'
        });

      if (insertError) throw insertError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Meal plan imported for months:', Object.keys(mealsByMonth));
      }
    } catch (error) {
      console.error('Error importing meal plan:', error);
      // Revertir actualización optimista
      setMonthlyMealPlans(originalMonthlyMealPlans);
      setError(error instanceof Error ? error.message : 'Error al importar');
      setStatus('error');
      throw error;
    }
  }, [user, monthlyMealPlans]);

  return {
    mealPlan,
    status,
    error,
    addMeal,
    removeMeal,
    importMealPlan,
    loadMealPlans
  };
};

// Función auxiliar para obtener los meses visibles
const getVisibleMonths = (): string[] => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const dayOfMonth = currentDate.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();

  const currentMonthStr = String(month).padStart(2, '0');
  const visibleMonths = [`${year}-${currentMonthStr}`];

  if (daysInMonth - dayOfMonth < 7) {
    let nextMonth = month + 1;
    let nextMonthYear = year;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextMonthYear = year + 1;
    }

    const nextMonthStr = String(nextMonth).padStart(2, '0');
    visibleMonths.push(`${nextMonthYear}-${nextMonthStr}`);
  }

  return visibleMonths;
};
