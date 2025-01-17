// src/features/habit/hooks/useHabitData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { 
  doc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

interface CompletedHabits {
  [key: string]: boolean;
}

export const useHabitData = () => {
  const [completedHabits, setCompletedHabits] = useState<CompletedHabits>({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const currentYear = new Date().getFullYear();
    const docRef = doc(db, 'habits', `${user.uid}_${currentYear}`);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setCompletedHabits(doc.data().habits || {});
          setStatus('saved');
        } else {
          setCompletedHabits({});
          setStatus('idle');
        }
      },
      (error) => {
        if (error instanceof Error) {
          setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } else {
          setError('An unknown error occurred');
        }
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const toggleHabit = async (habitId: number, date: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const year = new Date().getFullYear();
    const key = `${habitId}_${date}`;
    const newCompleted = {
      ...completedHabits,
      [key]: !completedHabits[key]
    };
    
    const docRef = doc(db, 'habits', `${user.uid}_${year}`);

    try {
      await setDoc(docRef, {
        userId: user.uid,
        year,
        habits: newCompleted,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  return {
    completedHabits,
    status,
    error,
    toggleHabit
  };
};