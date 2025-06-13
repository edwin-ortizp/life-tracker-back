import { useEffect, useState } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { HABITS } from '@/features/habit/types';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';

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

export interface DailySummaryData {
  journal: {
    words: number;
  };
  mood: {
    count: number;
  };  habits: {
    completed: number;
    total: number;
    incompletedByTimeOfDay?: Array<{
      timeOfDay: 'morning' | 'afternoon' | 'night' | 'anytime';
      habits: Array<{
        id: number;
        name: string;
        icon: string;
        goal: string;
      }>;
    }>;
  };
  negativeHabits: {
    count: number;
  };
  exercise: {
    minutes: number;
  };
  tasks: {
    completed: number; // Tasks completed on this specific day
    todayPlanned: number; // Tasks due today (completed or not)
    pending: number; // Incomplete tasks due today or in the future
    overdue: number; // Incomplete tasks due in the past
  };
  pomodoro: {
    count: number;
    expectedMinutes: number;
    workMinutes: number;
    completionRate: number; // As a percentage
    averageSessionLength: number;
  };  water: {
    intake: number;
    drinkDetails?: Array<{
      type: string;
      amount: number;
      count: number;
    }>;
  };
}

// Función de prueba para verificar permisos individualmente
export const testFirestorePermissions = async (uid: string, date: Date) => {
  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');
  
  console.log('🔧 Testing Firestore permissions for:', uid, dateStr);
  
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
      console.log(`🔍 Testing collection: ${col.name} with ID: ${col.id}`);
      const docSnap = await getDoc(doc(db, col.name, col.id));
      console.log(`✅ ${col.name}: Success - exists: ${docSnap.exists()}`);
    } catch (error) {
      console.error(`❌ ${col.name}: Error -`, error);
    }
  }
  
  // Test tasks collection with query
  try {
    console.log('🔍 Testing tasks collection with query');
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
    console.log(`✅ tasks (completed today): Success - found ${completedTaskDocs.size} documents`);

    // Query for tasks due today
    const dueTodayTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('dueDate', '>=', todayStart),
      where('dueDate', '<=', todayEnd)
    );
    const dueTodayTaskDocs = await getDocs(dueTodayTasksQuery);
    console.log(`✅ tasks (due today): Success - found ${dueTodayTaskDocs.size} documents`);
    
    // Query for incomplete tasks
    const incompleteTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', false)
    );
    const incompleteTaskDocs = await getDocs(incompleteTasksQuery);
    console.log(`✅ tasks (incomplete): Success - found ${incompleteTaskDocs.size} documents`);

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

    // Tasks: Today Planned
    const dueTodayTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      // Assuming dueDate is a Timestamp. Adjust if it's a string.
      where('dueDate', '>=', todayStartTimestamp),
      where('dueDate', '<=', todayEndTimestamp)
    );
    const dueTodayTaskDocs = await getDocs(dueTodayTasksQuery);
    const tasksTodayPlannedCount = dueTodayTaskDocs.size;
    
    // Tasks: Pending and Overdue (from all incomplete tasks for the user)
    let tasksPendingCount = 0;
    let tasksOverdueCount = 0;
    const incompleteTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', false)
    );
    const incompleteTaskDocs = await getDocs(incompleteTasksQuery);
    incompleteTaskDocs.forEach(taskDoc => {
      const task = taskDoc.data();
      if (task.dueDate && typeof task.dueDate.toDate === 'function') {
        const dueDate = startOfDay(task.dueDate.toDate()); // Normalize to compare dates only
        if (dueDate < startOfDay(date)) {
          tasksOverdueCount++;
        } else { // Due today or in the future
          tasksPendingCount++;
        }
      } else {
        // If no due date, consider it pending (or handle as per your logic)
        tasksPendingCount++;
      }
    });

    const result: DailySummaryData = {
      journal: {
        words: journalSnap.exists()
          ? (journalSnap.data().text || '').split(/\s+/).filter(Boolean).length
          : 0,
      },
      mood: {
        count: moodSnap.exists() ? (moodSnap.data().moods || []).length : 0,
      },      water: {
        intake: waterSnap.exists() ? waterSnap.data().totalWater || 0 : 0,
        drinkDetails: waterSnap.exists() ? processDrinkDetails(waterSnap.data()) : [],
      },
      exercise: {
        minutes: exerciseSnap.exists()
          ? exerciseSnap.data().summary?.totalDuration || 0
          : 0,
      },      pomodoro: (() => {
        const data = pomodoroSnap.exists() ? pomodoroSnap.data() : null;
        console.log('🍅 fetchDailySummary - Pomodoro data for', dateStr, ':', data);
        
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
        
        console.log('🍅 fetchDailySummary - extracted count:', count, 'workMinutes:', workMinutes);
        console.log('🍅 fetchDailySummary - sessions found:', data?.sessions?.length || 0);
        console.log('🍅 fetchDailySummary - available keys:', data ? Object.keys(data) : 'no data');
        
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
        todayPlanned: tasksTodayPlannedCount,
        pending: tasksPendingCount,
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
  mood: { count: 0 },
  habits: { completed: 0, total: HABITS.length, incompletedByTimeOfDay: [] },
  negativeHabits: { count: 0 },
  exercise: { minutes: 0 },  tasks: { completed: 0, todayPlanned: 0, pending: 0, overdue: 0 },
  pomodoro: { count: 0, expectedMinutes: 0, workMinutes: 0, completionRate: 0, averageSessionLength: 0 },
  water: { intake: 0, drinkDetails: [] }
};

// Función reutilizable para crear listeners de una fecha específica
export const createDayListeners = (
  uid: string,
  date: Date,
  onDataUpdate: (data: DailySummaryData) => void
): (() => void)[] => {
  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');
  const todayStartTimestamp = Timestamp.fromDate(startOfDay(date));
  const todayEndTimestamp = Timestamp.fromDate(endOfDay(date));

  console.log('🔍 createDayListeners - uid:', uid);
  console.log('🔍 createDayListeners - date:', date);
  console.log('🔍 createDayListeners - dateStr:', dateStr);

  // Referencias a documentos
  const journalRef = doc(db, 'journal', `${uid}_${dateStr}`);
  const moodRef = doc(db, 'moods', `${uid}_${dateStr}`);
  const waterRef = doc(db, 'water', `${uid}_${dateStr}`);
  const exerciseRef = doc(db, 'exercises', `${uid}_${dateStr}`);
  const pomodoroRef = doc(db, 'pomodoro', `${uid}_${dateStr}`);
  const habitRef = doc(db, 'habits', `${uid}_${year}-${month}`);
  const negativeRef = doc(db, 'negative-habits', `${uid}_${year}-${month}`);

  console.log('🔍 Pomodoro document ID will be:', `${uid}_${dateStr}`);

  // Estado temporal para almacenar los datos
  let journalData: any = null;
  let moodData: any = null;
  let waterData: any = null;
  let exerciseData: any = null;
  let pomodoroData: any = null;
  let habitData: any = null;
  let negativeData: any = null;
  let completedTasksTodayData: any[] = [];
  let dueTodayTasksData: any[] = [];
  let incompleteTasksData: any[] = [];

  // Función para recalcular el resumen
  const updateSummary = () => {
    const summary = createDailySummaryFromData(
      date,
      dateStr,
      journalData,
      moodData,
      waterData,
      exerciseData,
      pomodoroData,
      habitData,
      negativeData,
      completedTasksTodayData,
      dueTodayTasksData,
      incompleteTasksData
    );
    onDataUpdate(summary);
  };

  const unsubscribes: (() => void)[] = [];

  // Journal listener
  unsubscribes.push(onSnapshot(journalRef, (doc) => {
    journalData = doc.exists() ? doc.data() : null;
    updateSummary();
  }, (error) => console.error('❌ Journal listener error:', error)));

  // Mood listener
  unsubscribes.push(onSnapshot(moodRef, (doc) => {
    moodData = doc.exists() ? doc.data() : null;
    updateSummary();
  }, (error) => console.error('❌ Mood listener error:', error)));

  // Water listener
  unsubscribes.push(onSnapshot(waterRef, (doc) => {
    waterData = doc.exists() ? doc.data() : null;
    updateSummary();
  }, (error) => console.error('❌ Water listener error:', error)));

  // Exercise listener
  unsubscribes.push(onSnapshot(exerciseRef, (doc) => {
    exerciseData = doc.exists() ? doc.data() : null;
    updateSummary();
  }, (error) => console.error('❌ Exercise listener error:', error)));  // Pomodoro listener
  unsubscribes.push(onSnapshot(pomodoroRef, (doc) => {
    console.log('🔍 Pomodoro listener - Document ID:', doc.id);
    console.log('🔍 Pomodoro listener - Document exists:', doc.exists());
    console.log('🔍 Pomodoro listener - Full document data:', doc.data());
    
    pomodoroData = doc.exists() ? doc.data() : null;
    console.log('🍅 Pomodoro listener - processed data:', pomodoroData);
    
    if (pomodoroData) {
      console.log('🍅 Pomodoro listener - keys:', Object.keys(pomodoroData));
      console.log('🍅 Pomodoro listener - count:', pomodoroData.count);
      console.log('🍅 Pomodoro listener - sessions:', pomodoroData.sessions?.length || 0, 'sessions');
      console.log('🍅 Pomodoro listener - sessions data:', pomodoroData.sessions);      if (pomodoroData.sessions) {
        const totalDuration = pomodoroData.sessions.reduce((total: number, session: any) => total + (session.duration || 0), 0);
        console.log('🍅 Pomodoro listener - total duration (seconds):', totalDuration, 'minutes:', Math.round(totalDuration / 60));
      }
    } else {
      console.log('❌ Pomodoro listener - No data found for document');
    }
    updateSummary();
  }, (error) => console.error('❌ Pomodoro listener error:', error)));

  // Habits listener
  unsubscribes.push(onSnapshot(habitRef, (doc) => {
    habitData = doc.exists() ? doc.data() : null;
    updateSummary();
  }, (error) => console.error('❌ Habit listener error:', error)));

  // Negative habits listener
  unsubscribes.push(onSnapshot(negativeRef, (doc) => {
    negativeData = doc.exists() ? doc.data() : null;
    updateSummary();
  }, (error) => console.error('❌ Negative habit listener error:', error)));

  // Listener for tasks completed today
  const completedTasksQuery = query(
    collection(db, 'tasks'),
    where('userId', '==', uid),
    where('completed', '==', true),
    where('updatedAt', '>=', todayStartTimestamp),
    where('updatedAt', '<=', todayEndTimestamp)
  );
  unsubscribes.push(onSnapshot(completedTasksQuery, (snapshot) => {
    completedTasksTodayData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateSummary();
  }, (error) => console.error('❌ Task listener error (completed today):', error)));

  // Listener for tasks due today
  const dueTodayTasksQuery = query(
    collection(db, 'tasks'),
    where('userId', '==', uid),
    where('dueDate', '>=', todayStartTimestamp),
    where('dueDate', '<=', todayEndTimestamp)
  );
  unsubscribes.push(onSnapshot(dueTodayTasksQuery, (snapshot) => {
    dueTodayTasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateSummary();
  }, (error) => console.error('❌ Task listener error (due today):', error)));

  // Listener for all incomplete tasks for the user
  const incompleteTasksQuery = query(
    collection(db, 'tasks'),
    where('userId', '==', uid),
    where('completed', '==', false)
  );
  unsubscribes.push(onSnapshot(incompleteTasksQuery, (snapshot) => {
    incompleteTasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    updateSummary();
  }, (error) => console.error('❌ Task listener error (incomplete):', error)));

  return unsubscribes;
};

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
  dueTodayTasksData: any[],
  incompleteTasksData: any[]
): DailySummaryData => {
  const todayStartOfDay = startOfDay(date);

  let pendingCount = 0;
  let overdueCount = 0;
  incompleteTasksData.forEach(task => {
    if (task.dueDate && typeof task.dueDate.toDate === 'function') {
      const dueDate = startOfDay(task.dueDate.toDate());
      if (dueDate < todayStartOfDay) {
        overdueCount++;
      } else {
        pendingCount++;
      }
    } else {
      pendingCount++;
    }
  });

  return {
    journal: {
      words: journalData?.text ? journalData.text.split(/\s+/).filter(Boolean).length : 0,
    },
    mood: {
      count: moodData?.moods ? moodData.moods.length : 0,
    },    water: {
      intake: waterData?.totalWater || 0,
      drinkDetails: processDrinkDetails(waterData),
    },
    exercise: {
      minutes: exerciseData?.summary?.totalDuration || 0,
    },    pomodoro: (() => {
      const data = pomodoroData;
      console.log('🍅 Pomodoro data for', dateStr, ':', data);
      
      const count = data?.count || 0;
      
      // Calcular workMinutes sumando las duraciones de todas las sesiones
      let workMinutes = 0;
      if (data?.sessions && Array.isArray(data.sessions)) {
        workMinutes = data.sessions.reduce((total: number, session: any) => {
          // duration parece venir en segundos, convertir a minutos
          const sessionMinutes = session.duration ? Math.round(session.duration / 60) : 0;
          console.log('🍅 Session duration:', session.duration, 'seconds =', sessionMinutes, 'minutes');
          return total + sessionMinutes;
        }, 0);
      }
      
      console.log('🍅 Pomodoro extracted - count:', count, 'workMinutes:', workMinutes);
      console.log('🍅 Sessions found:', data?.sessions?.length || 0);
      console.log('🍅 Available keys in data:', data ? Object.keys(data) : 'no data');
      
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
      
      console.log('🍅 Final pomodoro result:', result);
      return result;
    })(),    habits: processHabitDetails(habitData, dateStr),
    negativeHabits: {
      count: negativeData?.habits?.[dateStr] ?
        Object.keys(negativeData.habits[dateStr]).length : 0,
    },
    tasks: {
      completed: completedTasksTodayData.length,
      todayPlanned: dueTodayTasksData.length,
      pending: pendingCount,
      overdue: overdueCount
    }
  };
};

export const useDailySummary = (date: Date) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DailySummaryData>(emptySummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log('❌ useDailySummary - No user authenticated');
      setLoading(false);
      return;
    }    console.log('🚀 useDailySummary - Setting up listeners for user:', user.uid, 'date:', date);
    setLoading(true);

    // Ejecutar test de permisos para debug
    testFirestorePermissions(user.uid, date);

    const handleDataUpdate = (data: DailySummaryData) => {
      setSummary(data);
      setLoading(false);
    };

    const unsubscribes = createDayListeners(user.uid, date, handleDataUpdate);
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up listeners');
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user, date]);

  const refetch = () => {
    console.log('🔄 Refetch requested - listeners will automatically update');
  };

  return { summary, loading, refetch };
};
