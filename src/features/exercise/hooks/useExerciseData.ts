// src/features/exercise/hooks/useExerciseData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { ExerciseLog } from '../types';
import { 
  doc, 
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

export const useExerciseData = (selectedDate: Date) => {
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchExerciseLogs = async () => {
      setStatus('loading');
      const date = getLocalDateString(selectedDate);
      
      try {
        const exercisesRef = collection(db, 'exercises');
        const q = query(
          exercisesRef,
          where('userId', '==', user.uid),
          where('date', '==', date)
        );

        const querySnapshot = await getDocs(q);
        const logs: ExerciseLog[] = [];
        
        querySnapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as ExerciseLog);
        });

        setExerciseLogs(logs);
        setStatus('idle');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error al cargar ejercicios');
        setStatus('error');
      }
    };

    fetchExerciseLogs();
  }, [user, selectedDate]);

  const logExercise = async (exerciseLog: Omit<ExerciseLog, 'id'>) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const exerciseRef = doc(collection(db, 'exercises'));
      await setDoc(exerciseRef, {
        ...exerciseLog,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      setExerciseLogs(prev => [...prev, { ...exerciseLog, id: exerciseRef.id }]);
      setStatus('idle');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar ejercicio');
      setStatus('error');
    }
  };

  const updateExerciseLog = async (id: string, updates: Partial<ExerciseLog>) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const exerciseRef = doc(db, 'exercises', id);
      await setDoc(exerciseRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setExerciseLogs(prev => 
        prev.map(log => 
          log.id === id ? { ...log, ...updates } : log
        )
      );
      setStatus('idle');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar ejercicio');
      setStatus('error');
    }
  };

  const deleteExerciseLog = async (id: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const exerciseRef = doc(db, 'exercises', id);
      await deleteDoc(exerciseRef);

      setExerciseLogs(prev => prev.filter(log => log.id !== id));
      setStatus('idle');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar ejercicio');
      setStatus('error');
    }
  };

  return {
    exerciseLogs,
    status,
    error,
    logExercise,
    updateExerciseLog,
    deleteExerciseLog
  };
};