// src/features/negative-habits/hooks/useNegativeHabitData.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { NegativeHabitLog } from '../types';
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

  // Transformar logs de DB a formato de UI (compatible con versión Firebase)
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

  // Calcular estadísticas
  const stats = useMemo(() => {
    return {
      ...getMonthStats(habits),
      topHabits: getTopHabits(habits),
      frequentDays: getMostFrequentDays(habits)
    };
  }, [habits]);

  // Cargar datos de hábitos negativos
  const loadNegativeHabitData = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      const currentDate = new Date();

      // Cargar año actual completo para estadísticas
      const startOfYear = `${currentDate.getFullYear()}-01-01`;
      const endOfYear = `${currentDate.getFullYear()}-12-31`;

      const { data, error: fetchError } = await supabase
        .from('negative_habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', new Date(startOfYear).getTime())
        .lte('timestamp', new Date(endOfYear).getTime())
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      setAllLogs(data || []);
      setStatus('saved');

      if (import.meta.env.DEV) {
        console.log('Negative habits data loaded:', (data || []).length, 'logs');
      }
    } catch (error) {
      console.error('Error loading negative habit data:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los datos');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    loadNegativeHabitData();
  }, [loadNegativeHabitData]);

  const logHabit = useCallback(async (habitId: number, date: string, note?: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    // Actualización optimista
    const timestamp = new Date(date).getTime();
    const optimisticLog = {
      id: `temp-${timestamp}-${habitId}`,
      user_id: user.id,
      habit_id: habitId,
      timestamp: timestamp,
      note: note || null
    };

    setAllLogs(prev => [optimisticLog, ...prev]);

    try {
      const { error: insertError } = await supabase
        .from('negative_habit_logs')
        .insert({
          user_id: user.id,
          habit_id: habitId,
          timestamp: timestamp,
          note: note || null
        });

      if (insertError) throw insertError;

      // Reload para obtener el ID real
      await loadNegativeHabitData();

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Negative habit logged for date:', date, 'habit:', habitId);
      }
    } catch (error) {
      console.error('Error logging negative habit:', error);
      // Revertir actualización optimista
      setAllLogs(prev => prev.filter(log => log.id !== optimisticLog.id));
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  }, [user, loadNegativeHabitData]);

  const removeLog = useCallback(async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const timestamp = new Date(date).getTime();
    const previousLogs = allLogs;

    // Actualización optimista
    setAllLogs(prev => prev.filter(log =>
      !(log.habit_id === habitId && log.timestamp === timestamp)
    ));

    try {
      const { error: deleteError } = await supabase
        .from('negative_habit_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('habit_id', habitId)
        .eq('timestamp', timestamp);

      if (deleteError) throw deleteError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Negative habit removed for date:', date, 'habit:', habitId);
      }
    } catch (error) {
      console.error('Error removing negative habit:', error);
      // Revertir actualización optimista
      setAllLogs(previousLogs);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  }, [user, allLogs]);

  return {
    habits,
    status,
    error,
    stats,
    logHabit,
    removeLog,
    loadNegativeHabitData
  };
};
