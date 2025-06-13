import { useEffect, useState } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';
import { DailySummaryData } from './useDailySummary';

export interface WeeklySummaryData {
  daily: { date: string; summary: DailySummaryData }[];
  totals: DailySummaryData;
}

const emptySummary: DailySummaryData = {
  journal: { words: 0 },
  mood: { count: 0 },
  habits: { completed: 0 },
  negativeHabits: { count: 0 },
  exercise: { minutes: 0 },
  tasks: { completed: 0, todayPlanned: 0, pending: 0, overdue: 0 },
  pomodoro: { count: 0 },
  water: { intake: 0 }
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
      const totals = { ...emptySummary }; 

      weekDates.forEach(date => {
        const dateStr = getLocalDateString(date);
        const daySummary = weeklyData[dateStr] || { ...emptySummary };
        daily.push({ date: dateStr, summary: daySummary });

        // Sumar a los totales
        totals.journal.words += daySummary.journal.words;
        totals.mood.count += daySummary.mood.count;
        totals.habits.completed += daySummary.habits.completed;
        totals.negativeHabits.count += daySummary.negativeHabits.count;
        totals.exercise.minutes += daySummary.exercise.minutes;
        totals.pomodoro.count += daySummary.pomodoro.count;
        totals.water.intake += daySummary.water.intake;
        
        // Sumar totales de tareas
        totals.tasks.completed += daySummary.tasks.completed;
        totals.tasks.todayPlanned += daySummary.tasks.todayPlanned;
        totals.tasks.pending += daySummary.tasks.pending;
        totals.tasks.overdue += daySummary.tasks.overdue;
      });

      console.log('📊 Updated weekly summary:', { daily: daily.length, totals });
      setSummary({ daily, totals });
      setLoading(false);
    };

    // Función para crear el resumen de un día basado en los datos de documentos
    const createDaySummary = (
      journalData: any,
      moodData: any,
      waterData: any,
      exerciseData: any,
      pomodoroData: any,
      habitData: any,
      negativeData: any,
      completedTasksForDay: any[],
      dueTodayTasksForDay: any[],
      allIncompleteTasksForUser: any[],
      currentProcessingDate: Date,
      dateStr: string
    ): DailySummaryData => {
      const tasksCompletedCount = completedTasksForDay.length;
      const tasksTodayPlannedCount = dueTodayTasksForDay.length;

      let tasksPendingCount = 0;
      let tasksOverdueCount = 0;
      const currentDayStart = startOfDay(currentProcessingDate);

      allIncompleteTasksForUser.forEach(task => {
        if (task.dueDate && typeof task.dueDate.toDate === 'function') {
          const dueDateStart = startOfDay(task.dueDate.toDate());
          if (dueDateStart < currentDayStart) {
            tasksOverdueCount++;
          } else {
            tasksPendingCount++;
          }
        } else {
          tasksPendingCount++;
        }
      });
      
      return {
        journal: {
          words: journalData?.text ? journalData.text.split(/\s+/).filter(Boolean).length : 0,
        },
        mood: {
          count: moodData?.moods ? moodData.moods.length : 0,
        },
        water: {
          intake: waterData?.totalWater || 0,
        },
        exercise: {
          minutes: exerciseData?.summary?.totalDuration || 0,
        },
        pomodoro: {
          count: pomodoroData?.count || 0,
        },
        habits: {
          completed: habitData?.habits ?
            Object.entries(habitData.habits).filter(([key, val]: [string, any]) =>
              key.endsWith(`_${dateStr}`) && val
            ).length : 0,
        },
        negativeHabits: {
          count: negativeData?.habits?.[dateStr] ?
            Object.keys(negativeData.habits[dateStr]).length : 0,
        },
        tasks: {
          completed: tasksCompletedCount,
          todayPlanned: tasksTodayPlannedCount,
          pending: tasksPendingCount,
          overdue: tasksOverdueCount,
        }
      };
    };

    // Arrays para almacenar todos los unsubscribes
    const unsubscribes: (() => void)[] = [];

    // Configurar listeners para cada día de la semana
    weekDates.forEach(date => {
      const dateStr = getLocalDateString(date);
      const [year, month] = dateStr.split('-');

      // Estado temporal para este día específico
      let journalData: any = null;
      let moodData: any = null;
      let waterData: any = null;
      let exerciseData: any = null;
      let pomodoroData: any = null;
      let habitData: any = null;
      let negativeData: any = null;
      let completedTasksForDayData: any[] = [];
      let dueTodayTasksForDayData: any[] = [];
      let incompleteTasksForUserData: any[] = [];

      // Función para actualizar los datos de este día específico
      const updateDayData = () => {
        weeklyData[dateStr] = createDaySummary(
          journalData, moodData, waterData, exerciseData,
          pomodoroData, habitData, negativeData,
          completedTasksForDayData,
          dueTodayTasksForDayData,
          incompleteTasksForUserData,
          date,
          dateStr
        );
        updateWeeklySummary();
      };

      // Referencias para este día
      const journalRef = doc(db, 'journal', `${user.uid}_${dateStr}`);
      const moodRef = doc(db, 'moods', `${user.uid}_${dateStr}`);
      const waterRef = doc(db, 'water', `${user.uid}_${dateStr}`);
      const exerciseRef = doc(db, 'exercises', `${user.uid}_${dateStr}`);
      const pomodoroRef = doc(db, 'pomodoro', `${user.uid}_${dateStr}`);
      const habitRef = doc(db, 'habits', `${user.uid}_${year}-${month}`);
      const negativeRef = doc(db, 'negative-habits', `${user.uid}_${year}-${month}`);

      // Listeners para este día
      unsubscribes.push(onSnapshot(journalRef, (doc) => {
        journalData = doc.exists() ? doc.data() : null;
        updateDayData();
      }, (error) => console.error(`❌ Journal listener error for ${dateStr}:`, error)));

      unsubscribes.push(onSnapshot(moodRef, (doc) => {
        moodData = doc.exists() ? doc.data() : null;
        updateDayData();
      }, (error) => console.error(`❌ Mood listener error for ${dateStr}:`, error)));

      unsubscribes.push(onSnapshot(waterRef, (doc) => {
        waterData = doc.exists() ? doc.data() : null;
        updateDayData();
      }, (error) => console.error(`❌ Water listener error for ${dateStr}:`, error)));

      unsubscribes.push(onSnapshot(exerciseRef, (doc) => {
        exerciseData = doc.exists() ? doc.data() : null;
        updateDayData();
      }, (error) => console.error(`❌ Exercise listener error for ${dateStr}:`, error)));

      unsubscribes.push(onSnapshot(pomodoroRef, (doc) => {
        pomodoroData = doc.exists() ? doc.data() : null;
        updateDayData();
      }, (error) => console.error(`❌ Pomodoro listener error for ${dateStr}:`, error)));

      unsubscribes.push(onSnapshot(habitRef, (doc) => {
        habitData = doc.exists() ? doc.data() : null;
        updateDayData();
      }, (error) => console.error(`❌ Habit listener error for ${dateStr}:`, error)));

      unsubscribes.push(onSnapshot(negativeRef, (doc) => {
        negativeData = doc.exists() ? doc.data() : null;
        updateDayData();
      }, (error) => console.error(`❌ Negative habit listener error for ${dateStr}:`, error)));

      // Task query listeners for this specific day
      const dayStartTimestamp = Timestamp.fromDate(startOfDay(date));
      const dayEndTimestamp = Timestamp.fromDate(endOfDay(date));

      // Listener for tasks completed on this specific day
      const completedTasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('completed', '==', true),
        where('updatedAt', '>=', dayStartTimestamp),
        where('updatedAt', '<=', dayEndTimestamp)
      );
      unsubscribes.push(onSnapshot(completedTasksQuery, (snapshot) => {
        completedTasksForDayData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateDayData();
      }, (error) => console.error(`❌ Task listener (completed for ${dateStr}):`, error)));

      // Listener for tasks due on this specific day
      const dueTodayTasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('dueDate', '>=', dayStartTimestamp),
        where('dueDate', '<=', dayEndTimestamp)
      );
      unsubscribes.push(onSnapshot(dueTodayTasksQuery, (snapshot) => {
        dueTodayTasksForDayData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateDayData();
      }, (error) => console.error(`❌ Task listener (due today for ${dateStr}):`, error)));
      
      // Listener for all incomplete tasks for the user
      const incompleteTasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('completed', '==', false)
      );
      unsubscribes.push(onSnapshot(incompleteTasksQuery, (snapshot) => {
        incompleteTasksForUserData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateDayData();
      }, (error) => console.error(`❌ Task listener (incomplete for user, affecting ${dateStr}):`, error)));
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up weekly listeners');
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, startDate]);

  const refetch = () => {
    console.log('🔄 Weekly refetch requested - listeners will automatically update');
  };

  return { summary, loading, refetch };
};
