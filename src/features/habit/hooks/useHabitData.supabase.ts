// src/features/habit/hooks/useHabitData.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface CompletedHabits {
  [key: string]: boolean;
}

export const useHabitData = () => {
  const [completedHabits, setCompletedHabits] = useState<CompletedHabits>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadHabits = async () => {
      try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        // Cargar todos los hábitos del año actual
        const startOfYear = `${currentYear}-01-01`;
        const endOfYear = `${currentYear}-12-31`;

        const { data, error: fetchError } = await supabase
          .from('habit_completions')
          .select('habit_id, date, completed')
          .eq('user_id', user.id)
          .gte('date', startOfYear)
          .lte('date', endOfYear);

        if (fetchError) throw fetchError;

        // Transformar a formato esperado por UI: { "habitId_YYYY-MM-DD": boolean }
        const habitsMap: CompletedHabits = {};
        (data || []).forEach(row => {
          const key = `${row.habit_id}_${row.date}`;
          habitsMap[key] = row.completed;
        });

        setCompletedHabits(habitsMap);
        setStatus('saved');
      } catch (error) {
        console.error('Error loading habits:', error);
        setError(error instanceof Error ? error.message : 'Error loading habits');
        setStatus('error');
      }
    };

    loadHabits();
  }, [user]);

  const toggleHabit = async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const key = `${habitId}_${date}`;
    const currentValue = completedHabits[key] || false;
    const newValue = !currentValue;

    // Actualización optimista
    setCompletedHabits(prev => ({
      ...prev,
      [key]: newValue
    }));

    try {
      // Upsert: insertar o actualizar
      const { error: upsertError } = await supabase
        .from('habit_completions')
        .upsert({
          user_id: user.id,
          habit_id: habitId,
          date: date,
          completed: newValue
        }, {
          onConflict: 'user_id,habit_id,date'
        });

      if (upsertError) throw upsertError;

      setStatus('saved');
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Revertir cambio optimista
      setCompletedHabits(prev => ({
        ...prev,
        [key]: currentValue
      }));
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  return {
    completedHabits,
    status,
    error,
    toggleHabit
  };
};
