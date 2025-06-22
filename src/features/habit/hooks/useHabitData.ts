// src/features/habit/hooks/useHabitData.ts
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';

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

    // Subscribe to current month
    const currentMonthRef = doc(db, 'habits', `${user.uid}_${yearMonth}`);
    const unsubscribe = onSnapshot(currentMonthRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as MonthlyHabits;
          setMonthlyHabitsMap(prev => ({
            ...prev,
            [yearMonth]: data.habits || {}
          }));

          if (import.meta.env.DEV) {
            console.log('Habit snapshot', {
              fromCache: doc.metadata.fromCache,
              pending: doc.metadata.hasPendingWrites
            });
          }

          if (doc.metadata.hasPendingWrites) {
            setStatus('pending');
          } else {
            setStatus('saved');
          }
        }
      },
      (error) => {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setStatus('error');
      }
    );

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
    return () => unsubscribe();
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
      await setDoc(docRef, {
        userId: user.uid,
        yearMonth,
        habits: newCompleted,
        updatedAt: serverTimestamp()
      }, { merge: true });
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
  const months: string[] = [];
  const currentYear = currentDate.getFullYear();
  
  // Add all months of current year up to current month
  for (let month = 1; month <= 12; month++) {
    months.push(`${currentYear}-${String(month).padStart(2, '0')}`);
  }
  
  return months;
};