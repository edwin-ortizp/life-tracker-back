// src/features/exercise/hooks/useExerciseData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { ExerciseDocument, ExerciseLog, EXERCISES } from '../types';
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';

export const useExerciseData = (selectedDate: Date) => {
  const [exerciseDoc, setExerciseDoc] = useState<ExerciseDocument | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Función para calcular el resumen de ejercicios
  const calculateSummary = (exercises: ExerciseLog[]) => {
    return exercises.reduce((summary, log) => {
      const exercise = EXERCISES.find(e => e.id === log.exerciseId);
      if (!exercise) return summary;

      // Actualizar totales
      summary.totalCalories += log.calories || 0;
      summary.totalSteps += log.steps || 0;
      summary.totalDuration += log.duration || 0;
      summary.totalDistance += log.distance || 0;

      // Actualizar estadísticas por categoría
      const catStats = summary.categoryStats[exercise.category];
      catStats.count += 1;
      catStats.duration += log.duration || 0;
      catStats.calories += log.calories || 0;

      return summary;
    }, {
      totalCalories: 0,
      totalSteps: 0,
      totalDuration: 0,
      totalDistance: 0,
      categoryStats: {
        cardio: { count: 0, duration: 0, calories: 0 },
        strength: { count: 0, duration: 0, calories: 0 },
        flexibility: { count: 0, duration: 0, calories: 0 }
      }
    });
  };

  useEffect(() => {
    if (!user) return;

    setStatus('loading');
    const date = getLocalDateString(selectedDate);
    const docRef = doc(db, 'exercises', `${user.uid}_${date}`);

    const unsubscribe = onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setExerciseDoc(docSnap.data() as ExerciseDocument);
        } else {
          setExerciseDoc(null);
        }

        if (import.meta.env.DEV) {
          console.log('Exercise snapshot', {
            fromCache: docSnap.metadata.fromCache,
            pending: docSnap.metadata.hasPendingWrites
          });
        }

        if (docSnap.metadata.hasPendingWrites) {
          setStatus('pending');
        } else {
          setStatus('saved');
        }
      },
      (error) => {
        setError(error instanceof Error ? error.message : 'Error al cargar ejercicios');
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate]);

  const logExercise = async (newExercise: ExerciseLog) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const date = getLocalDateString(selectedDate);
    const docRef = doc(db, 'exercises', `${user.uid}_${date}`);

    try {
      const newExercises = exerciseDoc?.exercises || [];
      newExercises.push(newExercise);

      const summary = calculateSummary(newExercises);
      const newDoc: ExerciseDocument = {
        userId: user.uid,
        date,
        exercises: newExercises,
        summary,
        createdAt: exerciseDoc?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, newDoc);
      setExerciseDoc(newDoc);
      if (import.meta.env.DEV) {
        console.log('Exercise logged locally');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar ejercicio');
      setStatus('error');
    }
  };

  const updateExerciseLog = async (index: number, updates: Partial<ExerciseLog>) => {
    if (!user || !exerciseDoc) return;

    setStatus('saving');
    setError(null);

    try {
      const date = getLocalDateString(selectedDate);
      const docRef = doc(db, 'exercises', `${user.uid}_${date}`);

      const updatedExercises = [...exerciseDoc.exercises];
      updatedExercises[index] = { ...updatedExercises[index], ...updates };

      const summary = calculateSummary(updatedExercises);
      const updatedDoc: ExerciseDocument = {
        ...exerciseDoc,
        exercises: updatedExercises,
        summary,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, updatedDoc);
      setExerciseDoc(updatedDoc);
      if (import.meta.env.DEV) {
        console.log('Exercise log updated locally');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar ejercicio');
      setStatus('error');
    }
  };

  const deleteExerciseLog = async (index: number) => {
    if (!user || !exerciseDoc) return;

    setStatus('saving');
    setError(null);

    try {
      const date = getLocalDateString(selectedDate);
      const docRef = doc(db, 'exercises', `${user.uid}_${date}`);

      const updatedExercises = exerciseDoc.exercises.filter((_, i) => i !== index);
      
      if (updatedExercises.length === 0) {
        // Si no quedan ejercicios, eliminar el documento completo
        await deleteDoc(docRef);
        setExerciseDoc(null);
      } else {
        const summary = calculateSummary(updatedExercises);
        const updatedDoc: ExerciseDocument = {
          ...exerciseDoc,
          exercises: updatedExercises,
          summary,
          updatedAt: serverTimestamp()
        };

        await setDoc(docRef, updatedDoc);
        setExerciseDoc(updatedDoc);
      }

      if (import.meta.env.DEV) {
        console.log('Exercise log deleted locally');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar ejercicio');
      setStatus('error');
    }
  };

  const resync = useResync('Exercise data');

  return {
    exerciseLogs: exerciseDoc?.exercises || [],
    summary: exerciseDoc?.summary,
    status,
    error,
    logExercise,
    updateExerciseLog,
    deleteExerciseLog,
    resync
  };
};