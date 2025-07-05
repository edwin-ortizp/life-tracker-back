import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { 
  DailySummaryData, 
  fetchDailySummary
} from './useDailySummary';

export interface WeeklySummaryData {
  daily: { date: string; summary: DailySummaryData }[];
  totals: DailySummaryData;
}

const emptySummary: DailySummaryData = {
  journal: { words: 0 },
  mood: { count: 0, average: 0, highest: 0, lowest: 0 },
  habits: { completed: 0, total: 18, incompletedByTimeOfDay: [] }, // Total hardcoded to avoid import issue
  negativeHabits: { count: 0 },
  exercise: { minutes: 0, calories: 0 },
  tasks: { completed: 0, todayPlanned: 0, pending: 0, overdue: 0 },
  pomodoro: { count: 0, expectedMinutes: 0, workMinutes: 0, completionRate: 0, averageSessionLength: 0 },
  water: { intake: 0, drinkDetails: [] }
};

export const useWeeklySummary = (startDate: Date) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WeeklySummaryData>({
    daily: [],
    totals: { ...emptySummary }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar datos de la semana (carga única)
  const loadWeeklySummary = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generar las 7 fechas de la semana
      const weekDates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        weekDates.push(d);
      }

      // Cargar datos de todos los días en paralelo
      const dailyPromises = weekDates.map(date => 
        fetchDailySummary(user.uid, date)
      );

      const dailyResults = await Promise.all(dailyPromises);

      // Procesar resultados
      const daily: { date: string; summary: DailySummaryData }[] = [];
      const totals = { ...emptySummary };

      weekDates.forEach((date, index) => {
        const dateStr = getLocalDateString(date);
        const daySummary = dailyResults[index];
        daily.push({ date: dateStr, summary: daySummary });

        // Sumar a los totales (valores acumulativos)
        totals.journal.words += daySummary.journal.words;
        totals.mood.count += daySummary.mood.count;
        totals.habits.completed += daySummary.habits.completed;
        totals.negativeHabits.count += daySummary.negativeHabits.count;
        totals.exercise.minutes += daySummary.exercise.minutes;
        totals.exercise.calories += daySummary.exercise.calories;
        totals.water.intake += daySummary.water.intake;
        
        // Sumar totales de tareas
        totals.tasks.completed += daySummary.tasks.completed;
        totals.tasks.todayPlanned += daySummary.tasks.todayPlanned;
        totals.tasks.pending += daySummary.tasks.pending;
        totals.tasks.overdue += daySummary.tasks.overdue;

        // Sumar pomodoro data (solo count y workMinutes son acumulativos)
        totals.pomodoro.count += daySummary.pomodoro.count;
        totals.pomodoro.workMinutes += daySummary.pomodoro.workMinutes;
      });

      // Calcular métricas derivadas para pomodoro de toda la semana
      const totalExpectedMinutes = 300 * 7; // 300 minutos por día durante 7 días
      totals.pomodoro.expectedMinutes = totalExpectedMinutes;
      
      // Completion rate: porcentaje de cumplimiento semanal (workMinutes totales vs esperado total)
      totals.pomodoro.completionRate = totalExpectedMinutes > 0 
        ? Math.min(100, (totals.pomodoro.workMinutes / totalExpectedMinutes) * 100) 
        : 0;
      
      // Average session length: duración promedio de todos los pomodoros de la semana
      totals.pomodoro.averageSessionLength = totals.pomodoro.count > 0 
        ? totals.pomodoro.workMinutes / totals.pomodoro.count 
        : 0;

      // Redondear valores decimales
      totals.pomodoro.completionRate = parseFloat(totals.pomodoro.completionRate.toFixed(1));
      totals.pomodoro.averageSessionLength = parseFloat(totals.pomodoro.averageSessionLength.toFixed(1));

      setSummary({ daily, totals });
      setLoading(false);

      if (import.meta.env.DEV) {
        console.log('📊 Weekly summary loaded for dates:', weekDates.map(d => getLocalDateString(d)));
      }
    } catch (err) {
      console.error('Error loading weekly summary:', err);
      setError(err instanceof Error ? err.message : 'Error loading weekly summary');
      setLoading(false);
    }
  }, [user, startDate]);

  useEffect(() => {
    loadWeeklySummary();
  }, [loadWeeklySummary]);

  const refetch = useCallback(() => {
    loadWeeklySummary();
  }, [loadWeeklySummary]);

  return { summary, loading, error, refetch };
};
