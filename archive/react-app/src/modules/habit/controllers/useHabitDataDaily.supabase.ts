// src/modules/hab../controllers/useHabitDataDaily.ts
import { useState, useEffect } from 'react';
import { HabitService } from '@/modules/habit/services';
import { useAuth } from '@/shared/hooks/useAuth';
import { getLocalDateString } from '@/shared/utils/dates';


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

        // Cargar hábitos del mes específico con último día válido del mes.
        const startDate = `${yearMonth}-01`;
        const lastDayOfMonth = new Date(Number(year), Number(month), 0).getDate();
        const endDate = `${yearMonth}-${String(lastDayOfMonth).padStart(2, '0')}`;

        const { data, error: fetchError } = await HabitService.getHabitCompletionsByRange(
          user.id,
          startDate,
          endDate
        );

        if (fetchError) throw fetchError;

        // Transformar a formato esperado
        const habitsMap: CompletedHabits = {};
        (data || []).forEach((row: any) => {
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
      const { error: upsertError } = await HabitService.upsertHabitCompletion({
        userId: user.id,
        habitId,
        date,
        completed: newValue
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
