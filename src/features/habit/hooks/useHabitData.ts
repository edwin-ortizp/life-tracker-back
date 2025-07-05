// src/features/habit/hooks/useHabitData.ts
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';
import { firestoreLogger } from '@/utils/firestore-logger';

interface CompletedHabits {
  [key: string]: boolean;
}

interface MonthlyHabits {
  userId: string;
  yearMonth: string;
  habits: CompletedHabits;
  updatedAt: any;
}

export const useHabitData = () => {
  const [monthlyHabitsMap, setMonthlyHabitsMap] = useState<Record<string, CompletedHabits>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Combine all monthly habits into a single object for the UI
  const completedHabits = useMemo(() => {
    return Object.values(monthlyHabitsMap).reduce((acc, monthHabits) => ({
      ...acc,
      ...monthHabits
    }), {});
  }, [monthlyHabitsMap]);

  useEffect(() => {
    if (!user) return;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Cargar mes actual (carga única)
    const loadCurrentMonth = async () => {
      try {
        firestoreLogger.logRead('habits', 'useHabitData.loadCurrentMonth', `${user.uid}_${yearMonth}`);
        const currentMonthRef = doc(db, 'habits', `${user.uid}_${yearMonth}`);
        const docSnapshot = await getDoc(currentMonthRef);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as MonthlyHabits;
          setMonthlyHabitsMap(prev => ({
            ...prev,
            [yearMonth]: data.habits || {}
          }));
          setStatus('saved');
        } else {
          // Inicializar mes vacío si no existe
          setMonthlyHabitsMap(prev => ({
            ...prev,
            [yearMonth]: {}
          }));
          setStatus('idle');
        }
      } catch (error) {
        console.error('Error loading current month habits:', error);
        setError(error instanceof Error ? error.message : 'Error loading habits');
        setStatus('error');
      }
    };

    loadCurrentMonth();

    // Fetch other visible months if needed (for yearly view)
    const fetchVisibleMonths = async () => {
      const visibleMonths = getVisibleMonths(currentDate);
      const habitsCollectionRef = collection(db, 'habits');
      
      for (const month of visibleMonths) {
        if (month === yearMonth) continue; // Skip current month as it's already subscribed
        
        try {
          const docSnap = await getDocs(query(habitsCollectionRef, 
            where('userId', '==', user.uid),
            where('yearMonth', '==', month)
          ));

          docSnap.forEach((doc) => {
            const data = doc.data() as MonthlyHabits;
            setMonthlyHabitsMap(prev => ({
              ...prev,
              [month]: data.habits || {}
            }));
          });
        } catch (error) {
          console.error(`Error fetching month ${month}:`, error);
        }
      }
    };

    fetchVisibleMonths();
  }, [user]);

  const toggleHabit = async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;
    const key = `${habitId}_${date}`;
    
    // Get current habits for this month
    const currentMonthHabits = monthlyHabitsMap[yearMonth] || {};
    const newCompleted = {
      ...currentMonthHabits,
      [key]: !currentMonthHabits[key]
    };
    
    const docRef = doc(db, 'habits', `${user.uid}_${yearMonth}`);

    try {
      firestoreLogger.logWrite('habits', 'useHabitData.toggleHabit', `${user.uid}_${yearMonth}`);
      await setDoc(docRef, {
        userId: user.uid,
        yearMonth,
        habits: newCompleted,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Actualizar estado local inmediatamente
      setMonthlyHabitsMap(prev => ({
        ...prev,
        [yearMonth]: newCompleted
      }));
      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const resync = useResync('Habit data');

  return {
    completedHabits,
    status,
    error,
    toggleHabit,
    resync
  };
};

// Helper function to get the months we need to fetch data for
const getVisibleMonths = (currentDate: Date): string[] => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const months: string[] = [];

  // Only add months from January up to the current month
  for (let month = 1; month <= currentMonth; month++) {
    const monthStr = String(month).padStart(2, '0');
    months.push(`${currentYear}-${monthStr}`);
  }

  return months;
};