// src/features/negative-habits/hooks/useNegativeHabitData.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getDoc } from 'firebase/firestore';
import { firestoreLogger } from '@/utils/firestore-logger';
import { useResync } from '@/hooks/useResync';
import { NegativeHabitLog } from '../types';
import { 
  MonthlyHabits,
  getMonthDocRef,
  logHabitToFirebase,
  removeHabitFromFirebase,
  fetchVisibleMonths
} from '../utils/firebase';
import {
  getMonthStats,
  getTopHabits,
  getMostFrequentDays
} from '../utils/stats';
import {
  getYearMonth,
  getVisibleMonths
} from '../utils/dates';

export const useNegativeHabitData = () => {
  const [monthlyHabitsMap, setMonthlyHabitsMap] = useState<Record<string, MonthlyHabits['habits']>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Combinar todos los hábitos mensuales para la UI
  const habits = useMemo(() => {
    const allHabits: { [key: string]: NegativeHabitLog } = {};
    
    Object.values(monthlyHabitsMap).forEach(monthHabits => {
      Object.entries(monthHabits).forEach(([date, dayHabits]) => {
        Object.entries(dayHabits).forEach(([habitId, log]) => {
          allHabits[`${habitId}_${date}`] = log;
        });
      });
    });
    
    return allHabits;
  }, [monthlyHabitsMap]);

  // Calcular estadísticas del mes actual
  const stats = useMemo(() => {
    
    return {
      ...getMonthStats(habits),
      topHabits: getTopHabits(habits),
      frequentDays: getMostFrequentDays(habits)
    };
  }, [habits, monthlyHabitsMap]);

  // Cargar datos de hábitos negativos (carga inicial única)
  const loadNegativeHabitData = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);
    const currentDate = new Date();
    const yearMonth = getYearMonth(currentDate);

    try {
      // Cargar mes actual
      firestoreLogger.logRead('negative-habits', 'useNegativeHabitData.loadCurrentMonth');
      const currentMonthDoc = await getDoc(getMonthDocRef(user.uid, yearMonth));
      
      let newMonthlyHabitsMap: Record<string, MonthlyHabits['habits']> = {};
      
      if (currentMonthDoc.exists()) {
        const data = currentMonthDoc.data() as MonthlyHabits;
        newMonthlyHabitsMap[yearMonth] = data.habits || {};
      }

      // Cargar meses visibles para la vista anual
      const months = getVisibleMonths(currentDate);
      const visibleMonthsData = await fetchVisibleMonths(user.uid, months);
      
      newMonthlyHabitsMap = {
        ...newMonthlyHabitsMap,
        ...visibleMonthsData
      };

      setMonthlyHabitsMap(newMonthlyHabitsMap);
      setStatus('saved');
      
      if (import.meta.env.DEV) {
        console.log('Negative habits data loaded for months:', Object.keys(newMonthlyHabitsMap));
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
    
    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;
    const currentMonthHabits = monthlyHabitsMap[yearMonth] || {};

    // Actualización optimista
    const optimisticLog: NegativeHabitLog = {
      timestamp: Date.now(),
      habitId,
      ...(note ? { note } : {})
    };

    const optimisticHabits = {
      ...currentMonthHabits,
      [date]: {
        ...currentMonthHabits[date],
        [habitId]: optimisticLog
      }
    };

    setMonthlyHabitsMap(prev => ({
      ...prev,
      [yearMonth]: optimisticHabits
    }));

    try {
      await logHabitToFirebase(
        user.uid,
        yearMonth,
        date,
        habitId,
        currentMonthHabits,
        note
      );
      
      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Negative habit logged for date:', date, 'habit:', habitId);
      }
    } catch (error) {
      console.error('Error logging negative habit:', error);
      // Revertir actualización optimista en caso de error
      setMonthlyHabitsMap(prev => ({
        ...prev,
        [yearMonth]: currentMonthHabits
      }));
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  }, [user, monthlyHabitsMap]);

  const removeLog = useCallback(async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;
    const currentMonthHabits = monthlyHabitsMap[yearMonth] || {};

    // Actualización optimista
    const optimisticHabits = { ...currentMonthHabits };
    if (optimisticHabits[date]) {
      const dayHabits = { ...optimisticHabits[date] };
      delete dayHabits[habitId];
      
      if (Object.keys(dayHabits).length === 0) {
        delete optimisticHabits[date];
      } else {
        optimisticHabits[date] = dayHabits;
      }
    }

    setMonthlyHabitsMap(prev => ({
      ...prev,
      [yearMonth]: optimisticHabits
    }));

    try {
      await removeHabitFromFirebase(
        user.uid,
        yearMonth,
        date,
        habitId,
        currentMonthHabits
      );
      
      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Negative habit removed for date:', date, 'habit:', habitId);
      }
    } catch (error) {
      console.error('Error removing negative habit:', error);
      // Revertir actualización optimista en caso de error
      setMonthlyHabitsMap(prev => ({
        ...prev,
        [yearMonth]: currentMonthHabits
      }));
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  }, [user, monthlyHabitsMap]);

  const resync = useResync('Negative habit data');

  return {
    habits,
    status,
    error,
    stats,
    logHabit,
    removeLog,
    loadNegativeHabitData,
    resync
  };
};