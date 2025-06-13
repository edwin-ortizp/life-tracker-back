import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { 
  DailySummaryData, 
  createDayListeners
} from './useDailySummary';

export interface WeeklySummaryData {
  daily: { date: string; summary: DailySummaryData }[];
  totals: DailySummaryData;
}

const emptySummary: DailySummaryData = {
  journal: { words: 0 },
  mood: { count: 0 },
  habits: { completed: 0, total: 18, incompletedByTimeOfDay: [] }, // Total hardcoded to avoid import issue
  negativeHabits: { count: 0 },
  exercise: { minutes: 0 },
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

  useEffect(() => {
    if (!user) {
      console.log('❌ useWeeklySummary - No user authenticated');
      setLoading(false);
      return;
    }

    console.log('🚀 useWeeklySummary - Setting up listeners for user:', user.uid, 'start date:', startDate);
    
    setLoading(true);

    // Generar las 7 fechas de la semana
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      weekDates.push(d);
    }

    // Estado para almacenar los datos de cada día
    const weeklyData: { [dateStr: string]: DailySummaryData } = {};

    // Función para recalcular el resumen semanal
    const updateWeeklySummary = () => {
      const daily: { date: string; summary: DailySummaryData }[] = [];
      const totals = { ...emptySummary };      weekDates.forEach(date => {
        const dateStr = getLocalDateString(date);
        const daySummary = weeklyData[dateStr] || { ...emptySummary };
        daily.push({ date: dateStr, summary: daySummary });

        // Sumar a los totales (valores acumulativos)
        totals.journal.words += daySummary.journal.words;
        totals.mood.count += daySummary.mood.count;
        totals.habits.completed += daySummary.habits.completed;
        totals.negativeHabits.count += daySummary.negativeHabits.count;
        totals.exercise.minutes += daySummary.exercise.minutes;
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

      console.log('📊 Updated weekly summary:', { daily: daily.length, totals });
      setSummary({ daily, totals });
      setLoading(false);
    };

    // Arrays para almacenar todos los unsubscribes
    const allUnsubscribes: (() => void)[] = [];

    // Configurar listeners para cada día de la semana
    weekDates.forEach(date => {
      const dateStr = getLocalDateString(date);

      // Función para actualizar los datos de este día específico
      const updateDayData = (dayData: DailySummaryData) => {
        weeklyData[dateStr] = dayData;
        updateWeeklySummary();
      };

      // Crear listeners para este día y agregar a la lista de cleanup
      const dayUnsubscribes = createDayListeners(user.uid, date, updateDayData);
      allUnsubscribes.push(...dayUnsubscribes);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up weekly listeners');
      allUnsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, startDate]);

  const refetch = () => {
    console.log('🔄 Weekly refetch requested - listeners will automatically update');
  };

  return { summary, loading, refetch };
};
