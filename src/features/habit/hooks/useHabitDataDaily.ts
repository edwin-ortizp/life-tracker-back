// src/features/habit/hooks/useHabitDataDaily.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestoreLogger } from '@/utils/firestore-logger';
import { getLocalDateString } from '@/utils/dates';

interface CompletedHabits {
  [key: string]: boolean;
}

interface UseHabitDataDailyReturn {
  completedHabits: CompletedHabits;
  status: 'idle' | 'saving' | 'pending' | 'saved' | 'error';
  error: string | null;
  toggleHabit: (habitId: number, date: string) => Promise<void>;
}

export const useHabitDataDaily = (date: Date): UseHabitDataDailyReturn => {
  const { user } = useAuth();
  const [completedHabits, setCompletedHabits] = useState<CompletedHabits>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');
  const yearMonth = `${year}-${month}`;

  useEffect(() => {
    if (!user) return;

    const loadDayData = async () => {
      try {
        setStatus('pending');
        setError(null);

        // Only load the specific month for this date
        const docRef = doc(db, 'habits', `${user.uid}_${yearMonth}`);
        firestoreLogger.logRead('habits', 'useHabitDataDaily.loadDayData', `${user.uid}_${yearMonth}`);
        
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompletedHabits(data.habits || {});
          setStatus('saved');
        } else {
          // Initialize empty if document doesn't exist
          setCompletedHabits({});
          setStatus('idle');
        }
      } catch (error) {
        console.error('Error loading daily habit data:', error);
        setError(error instanceof Error ? error.message : 'Error loading habits');
        setStatus('error');
      }
    };

    loadDayData();
  }, [user, yearMonth]);

  const toggleHabit = async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const [habitYear, habitMonth] = date.split('-');
      const habitYearMonth = `${habitYear}-${habitMonth}`;
      const habitKey = `${habitId}_${date}`;
      
      // Optimistic update
      const newValue = !completedHabits[habitKey];
      setCompletedHabits(prev => ({
        ...prev,
        [habitKey]: newValue
      }));

      const docRef = doc(db, 'habits', `${user.uid}_${habitYearMonth}`);
      
      // Update Firebase
      await setDoc(docRef, {
        habits: {
          ...completedHabits,
          [habitKey]: newValue
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      firestoreLogger.logWrite('habits', 'useHabitDataDaily.toggleHabit', `${user.uid}_${habitYearMonth}`);

      setStatus('saved');
    } catch (error) {
      console.error('Error toggling habit:', error);
      setError(error instanceof Error ? error.message : 'Error updating habit');
      setStatus('error');
      
      // Rollback optimistic update
      const habitKey = `${habitId}_${date}`;
      setCompletedHabits(prev => ({
        ...prev,
        [habitKey]: !prev[habitKey]
      }));
    }
  };

  return {
    completedHabits,
    status,
    error,
    toggleHabit
  };
};