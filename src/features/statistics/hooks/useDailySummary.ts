import { useEffect, useState } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
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

export interface DailySummaryData {
  journal: {
    words: number;
  };
  mood: {
    count: number;
  };
  habits: {
    completed: number;
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
  };
  water: {
    intake: number;
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
      },
      water: {
        intake: waterSnap.exists() ? waterSnap.data().totalWater || 0 : 0,
      },
      exercise: {
        minutes: exerciseSnap.exists()
          ? exerciseSnap.data().summary?.totalDuration || 0
          : 0,
      },
      pomodoro: {
        count: pomodoroSnap.exists() ? pomodoroSnap.data().count || 0 : 0,
      },
      habits: {
        completed: habitSnap.exists()
          ? Object.entries(habitSnap.data().habits || {}).filter(([key, val]) =>
              key.endsWith(`_${dateStr}`) && val
            ).length
          : 0,
      },
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
  habits: { completed: 0 },
  negativeHabits: { count: 0 },
  exercise: { minutes: 0 },
  tasks: { completed: 0, todayPlanned: 0, pending: 0, overdue: 0 },
  pomodoro: { count: 0 },
  water: { intake: 0 }
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
    }

    console.log('🚀 useDailySummary - Setting up listeners for user:', user.uid, 'date:', date);
    
    const dateStr = getLocalDateString(date);
    const [year, month] = dateStr.split('-');

    setLoading(true);

    // Referencias a documentos
    const journalRef = doc(db, 'journal', `${user.uid}_${dateStr}`);
    const moodRef = doc(db, 'moods', `${user.uid}_${dateStr}`);
    const waterRef = doc(db, 'water', `${user.uid}_${dateStr}`);
    const exerciseRef = doc(db, 'exercises', `${user.uid}_${dateStr}`);
    const pomodoroRef = doc(db, 'pomodoro', `${user.uid}_${dateStr}`);
    const habitRef = doc(db, 'habits', `${user.uid}_${year}-${month}`);
    const negativeRef = doc(db, 'negative-habits', `${user.uid}_${year}-${month}`);

    // Estado temporal para almacenar los datos de cada documento
    let journalData: any = null;
    let moodData: any = null;
    let waterData: any = null;
    let exerciseData: any = null;
    let pomodoroData: any = null;
    let habitData: any = null;
    let negativeData: any = null;
    
    // Task data states
    let completedTasksTodayData: any[] = [];
    let dueTodayTasksData: any[] = [];
    let incompleteTasksData: any[] = [];


    // Función para recalcular el resumen cuando cambien los datos
    const updateSummary = () => {
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
          pendingCount++; // Default to pending if no due date
        }
      });
      
      const newSummary: DailySummaryData = {
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
          completed: completedTasksTodayData.length,
          todayPlanned: dueTodayTasksData.length,
          pending: pendingCount,
          overdue: overdueCount
        }
      };

      // console.log('📊 Updated summary:', newSummary);
      setSummary(newSummary);
      setLoading(false);
    };

    // Listeners para cada documento
    const unsubscribes: (() => void)[] = [];

    // Journal listener
    unsubscribes.push(onSnapshot(journalRef, (doc) => {
      journalData = doc.exists() ? doc.data() : null;
      console.log('📖 Journal data updated:', journalData ? 'exists' : 'null');
      updateSummary();
    }, (error) => {
      console.error('❌ Journal listener error:', error);
    }));

    // Mood listener
    unsubscribes.push(onSnapshot(moodRef, (doc) => {
      moodData = doc.exists() ? doc.data() : null;
      console.log('😊 Mood data updated:', moodData ? 'exists' : 'null');
      updateSummary();
    }, (error) => {
      console.error('❌ Mood listener error:', error);
    }));

    // Water listener
    unsubscribes.push(onSnapshot(waterRef, (doc) => {
      waterData = doc.exists() ? doc.data() : null;
      console.log('💧 Water data updated:', waterData ? 'exists' : 'null');
      updateSummary();
    }, (error) => {
      console.error('❌ Water listener error:', error);
    }));

    // Exercise listener
    unsubscribes.push(onSnapshot(exerciseRef, (doc) => {
      exerciseData = doc.exists() ? doc.data() : null;
      console.log('🏃 Exercise data updated:', exerciseData ? 'exists' : 'null');
      updateSummary();
    }, (error) => {
      console.error('❌ Exercise listener error:', error);
    }));

    // Pomodoro listener
    unsubscribes.push(onSnapshot(pomodoroRef, (doc) => {
      pomodoroData = doc.exists() ? doc.data() : null;
      console.log('🍅 Pomodoro data updated:', pomodoroData ? 'exists' : 'null');
      updateSummary();
    }, (error) => {
      console.error('❌ Pomodoro listener error:', error);
    }));

    // Habits listener
    unsubscribes.push(onSnapshot(habitRef, (doc) => {
      habitData = doc.exists() ? doc.data() : null;
      console.log('✅ Habit data updated:', habitData ? 'exists' : 'null');
      updateSummary();
    }, (error) => {
      console.error('❌ Habit listener error:', error);
    }));

    // Negative habits listener
    unsubscribes.push(onSnapshot(negativeRef, (doc) => {
      negativeData = doc.exists() ? doc.data() : null;
      console.log('❌ Negative habit data updated:', negativeData ? 'exists' : 'null');
      updateSummary();
    }, (error) => {
      console.error('❌ Negative habit listener error:', error);
    }));

    // Tasks query listeners
    const todayStartTimestamp = Timestamp.fromDate(startOfDay(date));
    const todayEndTimestamp = Timestamp.fromDate(endOfDay(date));

    // Listener for tasks completed today
    const completedTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('completed', '==', true),
      where('updatedAt', '>=', todayStartTimestamp),
      where('updatedAt', '<=', todayEndTimestamp)
    );
    unsubscribes.push(onSnapshot(completedTasksQuery, (snapshot) => {
      completedTasksTodayData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // console.log('📝 Task data updated (completed today):', completedTasksTodayData.length, 'tasks');
      updateSummary();
    }, (error) => {
      console.error('❌ Task listener error (completed today):', error);
    }));

    // Listener for tasks due today
    const dueTodayTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('dueDate', '>=', todayStartTimestamp),
      where('dueDate', '<=', todayEndTimestamp)
    );
    unsubscribes.push(onSnapshot(dueTodayTasksQuery, (snapshot) => {
      dueTodayTasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // console.log('📝 Task data updated (due today):', dueTodayTasksData.length, 'tasks');
      updateSummary();
    }, (error) => {
      console.error('❌ Task listener error (due today):', error);
    }));

    // Listener for all incomplete tasks for the user
    const incompleteTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('completed', '==', false)
    );
    unsubscribes.push(onSnapshot(incompleteTasksQuery, (snapshot) => {
      incompleteTasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // console.log('📝 Task data updated (incomplete):', incompleteTasksData.length, 'tasks');
      updateSummary();
    }, (error) => {
      console.error('❌ Task listener error (incomplete):', error);
    }));
    
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
