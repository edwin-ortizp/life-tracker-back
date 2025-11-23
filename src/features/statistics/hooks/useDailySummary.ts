import { useEffect, useState, useCallback } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { HABITS } from '@/features/habit/types';
import { getMoodValue, calculateMoodAverage } from '@/features/mood/types';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';
import type { DailySummaryData } from '../types';

// Helper function to process habit details
const processHabitDetails = (habitData: any, dateStr: string) => {
  const totalHabits = HABITS.length;
  
  // Get completed habits for the specific date
  const completedHabits = habitData?.habits ? 
    Object.entries(habitData.habits).filter(([key, val]: [string, any]) =>
      key.endsWith(`_${dateStr}`) && val
    ).map(([key]) => {
      const habitId = parseInt(key.split('_')[0]);
      return HABITS.find(h => h.id === habitId);
    }).filter(Boolean) : [];

  const completedCount = completedHabits.length;

  // Get incompleted habits grouped by time of day
  const incompletedHabits = HABITS.filter(habit => 
    !completedHabits.some(completed => completed?.id === habit.id)
  );

  const incompletedByTimeOfDay = ['morning', 'afternoon', 'night', 'anytime'].map(timeOfDay => {
    const habitsForTime = incompletedHabits.filter(habit => habit.timeOfDay === timeOfDay);
    return {
      timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'night' | 'anytime',
      habits: habitsForTime.map(habit => ({
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        goal: habit.goal
      }))
    };
  }).filter(group => group.habits.length > 0);

  return {
    completed: completedCount,
    total: totalHabits,
    incompletedByTimeOfDay
  };
};
const processDrinkDetails = (waterData: any) => {
  if (!waterData?.drinks || !Array.isArray(waterData.drinks)) {
    return [];
  }

  const drinkMap = new Map<string, { amount: number; count: number }>();
  
  waterData.drinks.forEach((drink: any) => {
    const type = drink.type;
    const amount = drink.amount || 0;
    
    if (drinkMap.has(type)) {
      const existing = drinkMap.get(type)!;
      drinkMap.set(type, {
        amount: existing.amount + amount,
        count: existing.count + 1
      });
    } else {
      drinkMap.set(type, { amount, count: 1 });
    }
  });

  return Array.from(drinkMap.entries()).map(([type, data]) => ({
    type,
    amount: data.amount,
    count: data.count
  })).sort((a, b) => b.amount - a.amount); // Sort by amount descending
};

// Helper function to process mood details
const processMoodDetails = (moodData: any) => {
  if (!moodData?.moods || !Array.isArray(moodData.moods)) {
    return {
      count: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      details: []
    };
  }

  const moods = moodData.moods;
  const count = moods.length;
  
  if (count === 0) {
    return {
      count: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      details: []
    };
  }

  // Calcular valores numéricos usando el helper existente
  const average = calculateMoodAverage(moods);
  
  // Obtener valores para highest y lowest
  const values = moods.map((mood: any) => mood.value ?? getMoodValue(mood.text));
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  
  // Crear detalles con valores numéricos
  const details = moods.map((mood: any) => ({
    emoji: mood.emoji,
    text: mood.text,
    value: mood.value ?? getMoodValue(mood.text),
    time: mood.time
  }));

  return {
    count,
    average,
    highest,
    lowest,
    details
  };
};

// Función de prueba para verificar permisos individualmente
export const testFirestorePermissions = async (uid: string, date: Date) => {
  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');
  
  
  const collections = [
    { name: 'journal', id: `${uid}_${dateStr}` },
    { name: 'moods', id: `${uid}_${dateStr}` },
    { name: 'water', id: `${uid}_${dateStr}` },
    { name: 'exercises', id: `${uid}_${dateStr}` },
    { name: 'pomodoro', id: `${uid}_${dateStr}` },
    { name: 'habits', id: `${uid}_${year}-${month}` },
    { name: 'negative-habits', id: `${uid}_${year}-${month}` }
  ];
  
  for (const col of collections) {
    try {
      const docSnap = await getDoc(doc(db, col.name, col.id));
    } catch (error) {
      console.error(`❌ ${col.name}: Error -`, error);
    }
  }
  
  // Test tasks collection with query
  try {
    const todayStart = Timestamp.fromDate(startOfDay(date));
    const todayEnd = Timestamp.fromDate(endOfDay(date));
    
    // Query for completed tasks today
    const completedTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', true),
      where('updatedAt', '>=', todayStart),
      where('updatedAt', '<=', todayEnd)
    );
    const completedTaskDocs = await getDocs(completedTasksQuery);

    // Query for tasks due today
    const dueTodayTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('dueDate', '>=', todayStart),
      where('dueDate', '<=', todayEnd)
    );
    const dueTodayTaskDocs = await getDocs(dueTodayTasksQuery);
    
    // Query for incomplete tasks
    const incompleteTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', false)
    );
    const incompleteTaskDocs = await getDocs(incompleteTasksQuery);

  } catch (error) {
    console.error('❌ tasks: Error -', error);
  }
};

export const fetchDailySummary = async (uid: string, date: Date): Promise<DailySummaryData> => {
  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');
  const todayStartTimestamp = Timestamp.fromDate(startOfDay(date));
  const todayEndTimestamp = Timestamp.fromDate(endOfDay(date));

  // console.log('🔍 fetchDailySummary - UID:', uid);
  // console.log('🔍 fetchDailySummary - Date:', dateStr);
  // console.log('🔍 fetchDailySummary - Year/Month:', year, month);

  // No ejecutar testFirestorePermissions aquí para evitar logs excesivos en cada fetch
  // await testFirestorePermissions(uid, date);

  try {
    const journalSnap = await getDoc(doc(db, 'journal', `${uid}_${dateStr}`));
    const moodSnap = await getDoc(doc(db, 'moods', `${uid}_${dateStr}`));
    const waterSnap = await getDoc(doc(db, 'water', `${uid}_${dateStr}`));
    const exerciseSnap = await getDoc(doc(db, 'exercises', `${uid}_${dateStr}`));
    const pomodoroSnap = await getDoc(doc(db, 'pomodoro', `${uid}_${dateStr}`));
    const habitSnap = await getDoc(doc(db, 'habits', `${uid}_${year}-${month}`));
    const negativeSnap = await getDoc(doc(db, 'negative-habits', `${uid}_${year}-${month}`));

    // Tasks: Completed Today
    const completedTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', true),
      where('updatedAt', '>=', todayStartTimestamp),
      where('updatedAt', '<=', todayEndTimestamp)
    );
    const completedTaskDocs = await getDocs(completedTasksQuery);
    const tasksCompletedCount = completedTaskDocs.size;

    // Tasks: Active and Overdue - Incomplete tasks due today or in the past (dueDate <= today)
    const activeAndOverdueTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', false),
      where('dueDate', '<=', todayEndTimestamp)
    );
    const activeAndOverdueTaskDocs = await getDocs(activeAndOverdueTasksQuery);
    const tasksActiveAndOverdueCount = activeAndOverdueTaskDocs.size;

    // Tasks: Today Pending - Incomplete tasks due today only
    const todayPendingTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', false),
      where('dueDate', '>=', todayStartTimestamp),
      where('dueDate', '<=', todayEndTimestamp)
    );
    const todayPendingTaskDocs = await getDocs(todayPendingTasksQuery);
    const tasksTodayPendingCount = todayPendingTaskDocs.size;
    
    // Tasks: Overdue - Incomplete tasks due in the past (dueDate < today)
    const overdueTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', false),
      where('dueDate', '<', todayStartTimestamp)
    );
    const overdueTaskDocs = await getDocs(overdueTasksQuery);
    const tasksOverdueCount = overdueTaskDocs.size;

    const result: DailySummaryData = {
      journal: {
        words: journalSnap.exists()
          ? (journalSnap.data().text || '').split(/\s+/).filter(Boolean).length
          : 0,
      },
      mood: processMoodDetails(moodSnap.exists() ? moodSnap.data() : null),
      water: {
        intake: waterSnap.exists() ? waterSnap.data().totalWater || 0 : 0,
        drinkDetails: waterSnap.exists() ? processDrinkDetails(waterSnap.data()) : [],
      },
      exercise: (() => {
        const exerciseData = exerciseSnap.exists() ? exerciseSnap.data() : null;
        
        const minutes = exerciseData?.summary?.totalDuration || 0;
        const calories = exerciseData?.summary?.totalCalories || 0;
        
        
        return {
          minutes,
          calories,
        };
      })(),      pomodoro: (() => {
        const data = pomodoroSnap.exists() ? pomodoroSnap.data() : null;
        
        const count = data?.count || 0;
          // Calcular workMinutes sumando las duraciones de todas las sesiones
        let workMinutes = 0;
        if (data?.sessions && Array.isArray(data.sessions)) {
          workMinutes = data.sessions.reduce((total: number, session: any) => {
            // duration parece venir en segundos, convertir a minutos
            const sessionMinutes = session.duration ? Math.round(session.duration / 60) : 0;
            return total + sessionMinutes;
          }, 0);
        }
        
        
        const expectedMinutes = 300;
        const completionRate = expectedMinutes > 0 ? Math.min(100, (workMinutes / expectedMinutes) * 100) : 0;
        const averageSessionLength = count > 0 ? workMinutes / count : 0;
        return {
          count,
          expectedMinutes,
          workMinutes,
          completionRate: parseFloat(completionRate.toFixed(1)), // Keep one decimal place
          averageSessionLength: parseFloat(averageSessionLength.toFixed(1)), // Keep one decimal place
        };
      })(),      habits: processHabitDetails(habitSnap.exists() ? habitSnap.data() : null, dateStr),
      negativeHabits: {
        count: negativeSnap.exists()
          ? Object.keys(negativeSnap.data().habits?.[dateStr] || {}).length
          : 0,
      },
      tasks: {
        completed: tasksCompletedCount,
        activeAndOverdue: tasksActiveAndOverdueCount,
        todayPending: tasksTodayPendingCount,
        overdue: tasksOverdueCount
      }
    };

    // console.log('✅ Final result:', result);
    return result;
  } catch (error) {
    console.error('❌ fetchDailySummary - Error in try block:', error);
    throw error;
  }
};

const emptySummary: DailySummaryData = {
  journal: { words: 0 },
  mood: { count: 0, average: 0, highest: 0, lowest: 0, details: [] },
  habits: { completed: 0, total: HABITS.length, incompletedByTimeOfDay: [] },
  negativeHabits: { count: 0 },
  exercise: { minutes: 0, calories: 0 },  tasks: { completed: 0, activeAndOverdue: 0, todayPending: 0, overdue: 0 },
  pomodoro: { count: 0, expectedMinutes: 0, workMinutes: 0, completionRate: 0, averageSessionLength: 0 },
  water: { intake: 0, drinkDetails: [] }
};

// ⚠️ LEGACY CODE REMOVED: createDayListeners function eliminated
// This function created 8 onSnapshot listeners per day and was causing
// massive Firestore operations (56 listeners for weekly summaries).
// Replaced with single-load pattern using fetchDailySummary.

// Función reutilizable para crear un resumen diario a partir de datos
export const createDailySummaryFromData = (
  date: Date,
  dateStr: string,
  journalData: any,
  moodData: any,
  waterData: any,
  exerciseData: any,
  pomodoroData: any,
  habitData: any,
  negativeData: any,
  completedTasksTodayData: any[],
  incompleteTasksData: any[]
): DailySummaryData => {
  const todayStart = startOfDay(date);
  const todayEnd = endOfDay(date);

  let activeAndOverdueCount = 0;
  let todayPendingCount = 0;
  let overdueCount = 0;
  
  incompleteTasksData.forEach(task => {
    if (task.dueDate && typeof task.dueDate.toDate === 'function') {
      const dueDate = startOfDay(task.dueDate.toDate());
      
      // Active and Overdue: tasks due today or in the past (dueDate <= today)
      if (dueDate <= todayEnd) {
        activeAndOverdueCount++;
      }
      
      // Today Pending: tasks due today only 
      if (dueDate >= todayStart && dueDate <= todayEnd) {
        todayPendingCount++;
      }
      
      // Overdue: tasks due in the past (dueDate < today)
      if (dueDate < todayStart) {
        overdueCount++;
      }
    }
    // Tasks without dueDate are not counted in any category to match widget logic
  });

  return {
    journal: {
      words: journalData?.text ? journalData.text.split(/\s+/).filter(Boolean).length : 0,
    },    mood: processMoodDetails(moodData),water: {
      intake: waterData?.totalWater || 0,
      drinkDetails: processDrinkDetails(waterData),
    },
    exercise: (() => {
      
      const minutes = exerciseData?.summary?.totalDuration || 0;
      const calories = exerciseData?.summary?.totalCalories || 0;
      
      
      return {
        minutes,
        calories,
      };
    })(),    pomodoro: (() => {
      const data = pomodoroData;
      
      const count = data?.count || 0;
      
      // Calcular workMinutes sumando las duraciones de todas las sesiones
      let workMinutes = 0;
      if (data?.sessions && Array.isArray(data.sessions)) {
        workMinutes = data.sessions.reduce((total: number, session: any) => {
          // duration parece venir en segundos, convertir a minutos
          const sessionMinutes = session.duration ? Math.round(session.duration / 60) : 0;
          return total + sessionMinutes;
        }, 0);
      }
      
      
      const expectedMinutes = 300;
      const completionRate = expectedMinutes > 0 ? Math.min(100, (workMinutes / expectedMinutes) * 100) : 0;
      const averageSessionLength = count > 0 ? workMinutes / count : 0;
      
      const result = {
        count,
        expectedMinutes,
        workMinutes,
        completionRate: parseFloat(completionRate.toFixed(1)),
        averageSessionLength: parseFloat(averageSessionLength.toFixed(1)),
      };
      
      return result;
    })(),    habits: processHabitDetails(habitData, dateStr),
    negativeHabits: {
      count: negativeData?.habits?.[dateStr] ?
        Object.keys(negativeData.habits[dateStr]).length : 0,
    },
    tasks: {
      completed: completedTasksTodayData.length,
      activeAndOverdue: activeAndOverdueCount,
      todayPending: todayPendingCount,
      overdue: overdueCount
    }
  };
};

// Shared cache to avoid multiple listeners for the same date
const summaryCache = new Map<string, {
  summary: DailySummaryData;
  loading: boolean;
  subscribers: Set<(data: DailySummaryData, loading: boolean) => void>;
  unsubscribes: (() => void)[];
}>();

export const useDailySummary = (date: Date) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DailySummaryData>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const cacheKey = `${user.uid}_${getLocalDateString(date)}`;
    
    // Check cache first
    if (summaryCache.has(cacheKey)) {
      const cached = summaryCache.get(cacheKey)!;
      setSummary(cached.summary);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const summaryData = await fetchDailySummary(user.uid, date);
      
      // Cache the result
      summaryCache.set(cacheKey, {
        summary: summaryData,
        loading: false,
        subscribers: new Set(),
        unsubscribes: []
      });

      setSummary(summaryData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading daily summary:', err);
      setError(err instanceof Error ? err.message : 'Error loading summary');
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const refetch = useCallback(() => {
    if (!user) return;
    
    const cacheKey = `${user.uid}_${getLocalDateString(date)}`;
    // Clear cache for this date to force refresh
    summaryCache.delete(cacheKey);
    loadSummary();
  }, [user, date, loadSummary]);

  return { summary, loading, error, refetch };
};
