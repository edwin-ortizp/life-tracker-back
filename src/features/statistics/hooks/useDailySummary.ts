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
  journalWords: number;
  moodCount: number;
  habitsCompleted: number;
  negativeHabitCount: number;
  exerciseMinutes: number;
  tasksCompleted: number;
  pomodoroCount: number;
  waterIntake: number;
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
    const start = Timestamp.fromDate(startOfDay(date));
    const end = Timestamp.fromDate(endOfDay(date));
    const taskQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', true),
      where('updatedAt', '>=', start),
      where('updatedAt', '<=', end)
    );
    const taskDocs = await getDocs(taskQuery);
    console.log(`✅ tasks: Success - found ${taskDocs.size} documents`);
  } catch (error) {
    console.error('❌ tasks: Error -', error);
  }
};

export const fetchDailySummary = async (uid: string, date: Date): Promise<DailySummaryData> => {
  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');

  console.log('🔍 fetchDailySummary - UID:', uid);
  console.log('🔍 fetchDailySummary - Date:', dateStr);
  console.log('🔍 fetchDailySummary - Year/Month:', year, month);

  // Ejecutar pruebas de permisos primero
  await testFirestorePermissions(uid, date);

  try {
    const journalSnap = await getDoc(doc(db, 'journal', `${uid}_${dateStr}`));
    const moodSnap = await getDoc(doc(db, 'moods', `${uid}_${dateStr}`));
    const waterSnap = await getDoc(doc(db, 'water', `${uid}_${dateStr}`));
    const exerciseSnap = await getDoc(doc(db, 'exercises', `${uid}_${dateStr}`));
    const pomodoroSnap = await getDoc(doc(db, 'pomodoro', `${uid}_${dateStr}`));
    const habitSnap = await getDoc(doc(db, 'habits', `${uid}_${year}-${month}`));
    const negativeSnap = await getDoc(doc(db, 'negative-habits', `${uid}_${year}-${month}`));

    console.log('📊 Document exists check:');
    console.log('  - Journal:', journalSnap.exists(), journalSnap.exists() ? journalSnap.data() : 'No data');
    console.log('  - Mood:', moodSnap.exists(), moodSnap.exists() ? moodSnap.data() : 'No data');
    console.log('  - Water:', waterSnap.exists(), waterSnap.exists() ? waterSnap.data() : 'No data');
    console.log('  - Exercise:', exerciseSnap.exists(), exerciseSnap.exists() ? exerciseSnap.data() : 'No data');
    console.log('  - Pomodoro:', pomodoroSnap.exists(), pomodoroSnap.exists() ? pomodoroSnap.data() : 'No data');
    console.log('  - Habits:', habitSnap.exists(), habitSnap.exists() ? habitSnap.data() : 'No data');    console.log('  - Negative:', negativeSnap.exists(), negativeSnap.exists() ? negativeSnap.data() : 'No data');

    const start = Timestamp.fromDate(startOfDay(date));
    const end = Timestamp.fromDate(endOfDay(date));
    const taskQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', uid),
      where('completed', '==', true),
      where('updatedAt', '>=', start),
      where('updatedAt', '<=', end)
    );
    const taskDocs = await getDocs(taskQuery);

    console.log('📝 Task query result:', taskDocs.size, 'completed tasks found');
    console.log('📝 Task query date range:', start.toDate(), 'to', end.toDate());

    const result = {
      journalWords: journalSnap.exists()
        ? (journalSnap.data().text || '').split(/\s+/).filter(Boolean).length
        : 0,
      moodCount: moodSnap.exists() ? (moodSnap.data().moods || []).length : 0,
      waterIntake: waterSnap.exists() ? waterSnap.data().totalWater || 0 : 0,
      exerciseMinutes: exerciseSnap.exists()
        ? exerciseSnap.data().summary?.totalDuration || 0
        : 0,
      pomodoroCount: pomodoroSnap.exists() ? pomodoroSnap.data().count || 0 : 0,
      habitsCompleted: habitSnap.exists()
        ? Object.entries(habitSnap.data().habits || {}).filter(([key, val]) =>
            key.endsWith(`_${dateStr}`) && val
          ).length
        : 0,
      negativeHabitCount: negativeSnap.exists()
        ? Object.keys(negativeSnap.data().habits?.[dateStr] || {}).length
        : 0,
      tasksCompleted: taskDocs.size
    };

    console.log('✅ Final result:', result);
    return result;
  } catch (error) {
    console.error('❌ fetchDailySummary - Error in try block:', error);
    throw error;
  }
};

const emptySummary: DailySummaryData = {
  journalWords: 0,
  moodCount: 0,
  habitsCompleted: 0,
  negativeHabitCount: 0,
  exerciseMinutes: 0,
  tasksCompleted: 0,
  pomodoroCount: 0,
  waterIntake: 0
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
    let taskData: any[] = [];

    // Función para recalcular el resumen cuando cambien los datos
    const updateSummary = () => {
      const newSummary: DailySummaryData = {
        journalWords: journalData?.text ? journalData.text.split(/\s+/).filter(Boolean).length : 0,
        moodCount: moodData?.moods ? moodData.moods.length : 0,
        waterIntake: waterData?.totalWater || 0,
        exerciseMinutes: exerciseData?.summary?.totalDuration || 0,
        pomodoroCount: pomodoroData?.count || 0,
        habitsCompleted: habitData?.habits ? 
          Object.entries(habitData.habits).filter(([key, val]: [string, any]) =>
            key.endsWith(`_${dateStr}`) && val
          ).length : 0,
        negativeHabitCount: negativeData?.habits?.[dateStr] ? 
          Object.keys(negativeData.habits[dateStr]).length : 0,
        tasksCompleted: taskData.length
      };

      console.log('📊 Updated summary:', newSummary);
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

    // Tasks query listener
    const start = Timestamp.fromDate(startOfDay(date));
    const end = Timestamp.fromDate(endOfDay(date));
    const taskQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('completed', '==', true),
      where('updatedAt', '>=', start),
      where('updatedAt', '<=', end)
    );

    unsubscribes.push(onSnapshot(taskQuery, (snapshot) => {
      taskData = snapshot.docs.map(doc => doc.data());
      console.log('📝 Task data updated:', taskData.length, 'tasks');
      updateSummary();
    }, (error) => {
      console.error('❌ Task listener error:', error);
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
