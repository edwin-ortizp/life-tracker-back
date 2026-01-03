// src/features/habit/hooks/useHabitDataDaily.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';

interface CompletedHabits {
  [key: string]: boolean;
}

interface UseHabitDataDailyReturn {
  completedHabits: CompletedHabits;
  status: 'idle' | 'saving' | 'pending' | 'saved' | 'error';
  error: string | null;
  toggleHabit: (habitId: number, date: string) => Promise<void>;
}

export const useHabitDataDaily = (date: Date): UseHabitDataDailyReturn => {
  const { user } = useAuth();
  const [completedHabits, setCompletedHabits] = useState<CompletedHabits>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');
  const yearMonth = `${year}-${month}`;

  useEffect(() => {
    if (!user) return;

    const loadDayData = async () => {
      try {
        setStatus('pending');
        setError(null);

        // Cargar hábitos del mes específico
        const startDate = `${yearMonth}-01`;
        const endDate = `${yearMonth}-31`;

        const { data, error: fetchError } = await supabase
          .from('habit_completions')
          .select('habit_id, date, completed')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate);

        if (fetchError) throw fetchError;

        // Transformar a formato esperado
        const habitsMap: CompletedHabits = {};
        (data || []).forEach(row => {
          const key = `${row.habit_id}_${row.date}`;
          habitsMap[key] = row.completed;
        });

        setCompletedHabits(habitsMap);
        setStatus('saved');
      } catch (error) {
        console.error('Error loading daily habit data:', error);
        setError(error instanceof Error ? error.message : 'Error loading habits');
        setStatus('error');
      }
    };

    loadDayData();
  }, [user, yearMonth]);

  const toggleHabit = async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const habitKey = `${habitId}_${date}`;
    const newValue = !completedHabits[habitKey];

    // Actualización optimista
    setCompletedHabits(prev => ({
      ...prev,
      [habitKey]: newValue
    }));

    try {
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
      setError(error instanceof Error ? error.message : 'Error updating habit');
      setStatus('error');

      // Revertir optimistic update
      setCompletedHabits(prev => ({
        ...prev,
        [habitKey]: !newValue
      }));
    }
  };

  return {
    completedHabits,
    status,
    error,
    toggleHabit
  };
};
