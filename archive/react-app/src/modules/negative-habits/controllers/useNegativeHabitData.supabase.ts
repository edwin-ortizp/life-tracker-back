// src/modules/negative-habits/controllers/useNegativeHabitData.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { NegativeHabitsService } from '@/modules/negative-habits/services';
import { NegativeHabitLog } from '../models';
import {
  getMonthStats,
  getTopHabits,
  getMostFrequentDays
} from '../utils/stats';


export const useNegativeHabitData = () => {
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Transform logs from DB to UI format
  const habits = useMemo(() => {
    const habitsMap: { [key: string]: NegativeHabitLog } = {};

    allLogs.forEach(row => {
      const dateStr = new Date(row.timestamp).toISOString().split('T')[0];
      const key = `${row.habit_id}_${dateStr}`;

      habitsMap[key] = {
        timestamp: row.timestamp,
        habitId: row.habit_id,
        ...(row.note && { note: row.note })
      };
    });

    return habitsMap;
  }, [allLogs]);

  const stats = useMemo(() => {
    return {
      ...getMonthStats(habits),
      topHabits: getTopHabits(habits),
      frequentDays: getMostFrequentDays(habits)
    };
  }, [habits]);

  const loadNegativeHabitData = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      const currentDate = new Date();
      const startOfYear = `${currentDate.getFullYear()}-01-01`;
      const endOfYear = `${currentDate.getFullYear()}-12-31`;

      const { data, error: fetchError } = await NegativeHabitsService.table('negative_habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', new Date(startOfYear).getTime())
        .lte('timestamp', new Date(endOfYear).getTime())
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      setAllLogs(data || []);
      setStatus('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    loadNegativeHabitData();
  }, [loadNegativeHabitData]);

  const logHabit = async (habitId: number, date: string, note?: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const timestamp = new Date(`${date}T12:00:00`).getTime();

      const { error: insertError } = await NegativeHabitsService.table('negative_habit_logs')
        .insert({
          user_id: user.id,
          habit_id: habitId,
          timestamp,
          note
        });

      if (insertError) throw insertError;

      await loadNegativeHabitData();
      setStatus('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const removeLog = async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const startOfDay = new Date(`${date}T00:00:00`).getTime();
      const endOfDay = new Date(`${date}T23:59:59`).getTime();

      const { error: deleteError } = await NegativeHabitsService.table('negative_habit_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('habit_id', habitId)
        .gte('timestamp', startOfDay)
        .lte('timestamp', endOfDay);

      if (deleteError) throw deleteError;

      await loadNegativeHabitData();
      setStatus('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  return {
    habits,
    stats,
    status,
    error,
    logHabit,
    removeLog,
    reload: loadNegativeHabitData,
  };
};
