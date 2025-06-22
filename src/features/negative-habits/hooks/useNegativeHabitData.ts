// src/features/negative-habits/hooks/useNegativeHabitData.ts
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { onSnapshot } from 'firebase/firestore';
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

  useEffect(() => {
    if (!user) return;

    const currentDate = new Date();
    const yearMonth = getYearMonth(currentDate);
    setStatus('loading');

    // Suscribirse al mes actual
    const unsubscribe = onSnapshot(
      getMonthDocRef(user.uid, yearMonth),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as MonthlyHabits;
          setMonthlyHabitsMap(prev => ({
            ...prev,
            [yearMonth]: data.habits || {}
          }));
        }

        if (import.meta.env.DEV) {
          console.log('Negative habit snapshot', {
            fromCache: doc.metadata.fromCache,
            pending: doc.metadata.hasPendingWrites
          });
        }

        if (doc.metadata.hasPendingWrites) {
          setStatus('pending');
        } else {
          setStatus('saved');
        }
      },
      (error) => {
        setError(error instanceof Error ? error.message : 'Error al cargar los datos');
        setStatus('error');
      }
    );

    // Cargar meses visibles para la vista anual
    const loadVisibleMonths = async () => {
      const months = getVisibleMonths(currentDate);
      const visibleMonthsData = await fetchVisibleMonths(user.uid, months);
      setMonthlyHabitsMap(prev => ({
        ...prev,
        ...visibleMonthsData
      }));
    };

    loadVisibleMonths();
    return () => unsubscribe();
  }, [user]);

  const logHabit = async (habitId: number, date: string, note?: string) => {
    if (!user) return;

    try {
      setStatus('saving');
      setError(null);
      
      const [year, month] = date.split('-');
      const yearMonth = `${year}-${month}`;
      const currentMonthHabits = monthlyHabitsMap[yearMonth] || {};

      await logHabitToFirebase(
        user.uid,
        yearMonth,
        date,
        habitId,
        currentMonthHabits,
        note
      );
      if (import.meta.env.DEV) {
        console.log('Negative habit logged locally');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const removeLog = async (habitId: number, date: string) => {
    if (!user) return;

    try {
      setStatus('saving');
      setError(null);

      const [year, month] = date.split('-');
      const yearMonth = `${year}-${month}`;
      const currentMonthHabits = monthlyHabitsMap[yearMonth] || {};

      await removeHabitFromFirebase(
        user.uid,
        yearMonth,
        date,
        habitId,
        currentMonthHabits
      );
      if (import.meta.env.DEV) {
        console.log('Negative habit removed locally');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const resync = useResync('Negative habit data');

  return {
    habits,
    status,
    error,
    stats,
    logHabit,
    removeLog,
    resync
  };
};