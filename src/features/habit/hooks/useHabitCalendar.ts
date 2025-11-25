// src/features/habit/hooks/useHabitCalendar.ts
import { useMemo, useState, useCallback } from 'react';
import { Habit, HABITS } from '../types';
import { useHabitDataDaily } from './useHabitDataDaily';
import { getLocalDateString } from '@/utils/dates';
import { timeToPixels } from '@/utils/dates';
import {
  parseGoalDuration,
  calculateHabitHeight,
  parseTimeToDate,
} from '../utils/calendarUtils';

export interface HabitWithCalendarData extends Habit {
  displayTime: string; // "HH:mm" final (base o personalizado)
  displayTimeDate: Date; // Objeto Date completo
  durationMinutes: number; // Parseado de goal
  top: number; // Pixels desde 6:00
  height: number; // Pixels (mín 72px)
  isCompleted: boolean; // Estado de completación desde Firestore
}

export interface UseHabitCalendarReturn {
  habits: HabitWithCalendarData[]; // Solo pendientes
  updateHabitTime: (habitId: number, date: string, time: string) => void;
  resetHabitTime: (habitId: number, date: string) => void;
  getHabitTime: (habitId: number, date: string) => string;
  toggleHabitCompletion: (habitId: number, date: string) => Promise<void>;
}

const LOCALSTORAGE_KEY = 'habit-calendar-times';

/**
 * Hook para gestionar hábitos en la vista de calendario
 * - Filtra solo hábitos pendientes (no completados)
 * - Combina tiempos base con personalizaciones en localStorage
 * - Calcula posiciones y alturas para renderizado
 * - Integra con Firestore para estado de completación
 */
export const useHabitCalendar = (date: Date): UseHabitCalendarReturn => {
  const dateString = getLocalDateString(date);
  const { completedHabits, toggleHabit } = useHabitDataDaily(date);

  // Estado para forzar re-render cuando cambia localStorage
  const [localStorageVersion, setLocalStorageVersion] = useState(0);

  // Obtener tiempo personalizado de localStorage o usar baseTime
  const getHabitTime = useCallback((habitId: number, date: string): string => {
    try {
      const data = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
      return data[date]?.[habitId] || HABITS.find((h) => h.id === habitId)?.baseTime || '09:00';
    } catch (error) {
      console.error('Error reading habit time from localStorage:', error);
      return HABITS.find((h) => h.id === habitId)?.baseTime || '09:00';
    }
  }, []);

  // Actualizar tiempo personalizado en localStorage
  const updateHabitTime = useCallback((habitId: number, date: string, time: string): void => {
    try {
      const data = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
      if (!data[date]) data[date] = {};
      data[date][habitId] = time;
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
      console.log('Saved habit time to localStorage:', { habitId, date, time, data });

      // Forzar re-render
      setLocalStorageVersion(prev => prev + 1);
    } catch (error) {
      console.error('Error saving habit time to localStorage:', error);
    }
  }, []);

  // Resetear tiempo personalizado (volver a baseTime)
  const resetHabitTime = useCallback((habitId: number, date: string): void => {
    try {
      const data = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
      if (data[date]?.[habitId]) {
        delete data[date][habitId];
        if (Object.keys(data[date]).length === 0) {
          delete data[date];
        }
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));

        // Forzar re-render
        setLocalStorageVersion(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error resetting habit time in localStorage:', error);
    }
  }, []);

  // Toggle completación (wrapper para toggleHabit de Firestore)
  const toggleHabitCompletion = async (habitId: number, date: string): Promise<void> => {
    await toggleHabit(habitId, date);
  };

  // Calcular hábitos con datos de calendario (solo pendientes)
  const habits = useMemo((): HabitWithCalendarData[] => {
    return HABITS.filter((habit) => {
      // Filtrar: solo mostrar hábitos NO completados
      const habitKey = `${habit.id}_${dateString}`;
      const isCompleted = completedHabits[habitKey] === true;
      return !isCompleted;
    }).map((habit) => {
      // Obtener tiempo (personalizado o base)
      const displayTime = getHabitTime(habit.id, dateString);
      const displayTimeDate = parseTimeToDate(displayTime, date);

      // Parsear duración
      const durationMinutes = parseGoalDuration(habit.goal);

      // Calcular posición y altura
      const top = timeToPixels(displayTimeDate, 6); // Calendario empieza a las 6:00
      const height = calculateHabitHeight(durationMinutes);

      // Estado de completación
      const habitKey = `${habit.id}_${dateString}`;
      const isCompleted = completedHabits[habitKey] === true;

      return {
        ...habit,
        displayTime,
        displayTimeDate,
        durationMinutes,
        top,
        height,
        isCompleted,
      };
    });
  }, [dateString, completedHabits, date, localStorageVersion, getHabitTime]);

  return {
    habits,
    updateHabitTime,
    resetHabitTime,
    getHabitTime,
    toggleHabitCompletion,
  };
};
