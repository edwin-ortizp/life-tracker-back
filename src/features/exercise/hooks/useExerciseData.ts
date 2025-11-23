// src/features/exercise/hooks/useExerciseData.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { ExerciseDocument, ExerciseLog, EXERCISES } from '../types';
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';
import { firestoreLogger } from '@/utils/firestore-logger';

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

  // Cargar datos de ejercicios (carga única)
  const loadExerciseData = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      const date = getLocalDateString(selectedDate);
      firestoreLogger.logRead('exercises', 'useExerciseData.loadData', `${user.uid}_${date}`);
      const docRef = doc(db, 'exercises', `${user.uid}_${date}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setExerciseDoc(docSnap.data() as ExerciseDocument);
      } else {
        setExerciseDoc(null);
      }
      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar ejercicios');
      setStatus('error');
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadExerciseData();
  }, [loadExerciseData]);

  const logExercise = async (newExercise: ExerciseLog) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const date = getLocalDateString(selectedDate);
    const docRef = doc(db, 'exercises', `${user.uid}_${date}`);

    // Optimistic update: update UI immediately
    const newExercises = exerciseDoc?.exercises || [];
    newExercises.push(newExercise);
    const summary = calculateSummary(newExercises);
    const optimisticDoc: ExerciseDocument = {
      userId: user.uid,
      date,
      exercises: newExercises,
      summary,
      createdAt: exerciseDoc?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    setExerciseDoc(optimisticDoc);
    setStatus('saved');

    try {
      firestoreLogger.logWrite('exercises', 'useExerciseData.logExercise', `${user.uid}_${date}`);
      await setDoc(docRef, optimisticDoc);
      
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      // Rollback on error
      setExerciseDoc(exerciseDoc);
      setError(error instanceof Error ? error.message : 'Error al guardar ejercicio');
      setStatus('error');
    }
  };

  const updateExerciseLog = async (index: number, updates: Partial<ExerciseLog>) => {
    if (!user || !exerciseDoc) return;

    setStatus('saving');
    setError(null);

    // Save previous state for rollback
    const previousDoc = exerciseDoc;
    
    // Optimistic update: update UI immediately
    const updatedExercises = [...exerciseDoc.exercises];
    updatedExercises[index] = { ...updatedExercises[index], ...updates };
    const summary = calculateSummary(updatedExercises);
    const updatedDoc: ExerciseDocument = {
      ...exerciseDoc,
      exercises: updatedExercises,
      summary,
      updatedAt: serverTimestamp()
    };
    
    setExerciseDoc(updatedDoc);
    setStatus('saved');

    try {
      const date = getLocalDateString(selectedDate);
      const docRef = doc(db, 'exercises', `${user.uid}_${date}`);
      
      firestoreLogger.logWrite('exercises', 'useExerciseData.updateExerciseLog', `${user.uid}_${date}`);
      await setDoc(docRef, updatedDoc);
      
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      // Rollback on error
      setExerciseDoc(previousDoc);
      setError(error instanceof Error ? error.message : 'Error al actualizar ejercicio');
      setStatus('error');
    }
  };

  const deleteExerciseLog = async (index: number) => {
    if (!user || !exerciseDoc) return;

    setStatus('saving');
    setError(null);

    // Save previous state for rollback
    const previousDoc = exerciseDoc;
    
    // Optimistic update: update UI immediately
    const updatedExercises = exerciseDoc.exercises.filter((_, i) => i !== index);
    
    if (updatedExercises.length === 0) {
      setExerciseDoc(null);
    } else {
      const summary = calculateSummary(updatedExercises);
      const updatedDoc: ExerciseDocument = {
        ...exerciseDoc,
        exercises: updatedExercises,
        summary,
        updatedAt: serverTimestamp()
      };
      setExerciseDoc(updatedDoc);
    }
    
    setStatus('saved');

    try {
      const date = getLocalDateString(selectedDate);
      const docRef = doc(db, 'exercises', `${user.uid}_${date}`);
      
      if (updatedExercises.length === 0) {
        // Si no quedan ejercicios, eliminar el documento completo
        firestoreLogger.logDelete('exercises', 'useExerciseData.deleteExerciseLog.delete', `${user.uid}_${date}`);
        await deleteDoc(docRef);
      } else {
        const summary = calculateSummary(updatedExercises);
        const updatedDoc: ExerciseDocument = {
          ...exerciseDoc,
          exercises: updatedExercises,
          summary,
          updatedAt: serverTimestamp()
        };

        firestoreLogger.logWrite('exercises', 'useExerciseData.deleteExerciseLog.update', `${user.uid}_${date}`);
        await setDoc(docRef, updatedDoc);
      }

      if (import.meta.env.DEV) {
      }
    } catch (error) {
      // Rollback on error
      setExerciseDoc(previousDoc);
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
    loadExerciseData, // Exponer función de recarga manual
    resync
  };
};