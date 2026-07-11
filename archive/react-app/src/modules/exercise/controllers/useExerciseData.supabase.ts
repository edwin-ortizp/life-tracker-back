// src/modules/exerci../controllers/useExerciseData.ts
import { useState, useEffect, useCallback } from 'react';
import { ExerciseService } from '@/modules/exercise/services';
import { useAuth } from '@/shared/hooks/useAuth';
import { getLocalDateString } from '@/shared/utils/dates';
import { ExerciseLog } from '../models';
import { useExerciseTypes } from './useExerciseTypes';

export const useExerciseData = (selectedDate: Date) => {
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { exerciseTypes, getExerciseTypeById } = useExerciseTypes();

  // Función para calcular el resumen de ejercicios
  const calculateSummary = (exercises: ExerciseLog[]) => {
    return exercises.reduce((summary, log) => {
      const exerciseType = getExerciseTypeById(log.exerciseId);
      if (!exerciseType) return summary;

      // Actualizar totales
      summary.totalCalories += log.calories || 0;
      summary.totalSteps += log.steps || 0;
      summary.totalDuration += log.duration || 0;
      summary.totalDistance += log.distance || 0;

      // Actualizar estadísticas por categoría
      const catStats = summary.categoryStats[exerciseType.category];
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

  // Cargar datos de ejercicios
  const loadExerciseData = useCallback(async () => {
    if (!user || exerciseTypes.length === 0) return;

    setStatus('loading');
    setError(null);

    try {
      const date = getLocalDateString(selectedDate);

      const { data, error: fetchError } = await ExerciseService.getExerciseLogsByDate(user.id, date);

      if (fetchError) throw fetchError;

      // Transformar a formato esperado, usando exercise_type_id si está disponible
      const logs: ExerciseLog[] = (data || []).map(row => ({
        exerciseId: row.exercise_type_id || row.exercise_id, // Usar UUID si está disponible, sino fallback al ID antiguo
        sets: row.sets,
        reps: row.reps,
        duration: row.duration,
        distance: row.distance,
        weight: row.weight,
        calories: row.calories,
        steps: row.steps,
        notes: row.notes
      }));

      setExerciseLogs(logs);
      setSummary(calculateSummary(logs));
      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar ejercicios');
      setStatus('error');
    }
  }, [user, selectedDate, exerciseTypes]);

  useEffect(() => {
    loadExerciseData();
  }, [loadExerciseData]);

  const logExercise = async (newExercise: ExerciseLog) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const date = getLocalDateString(selectedDate);
    const previousLogs = exerciseLogs;

    // Optimistic update
    const newExercises = [...exerciseLogs, newExercise];
    setExerciseLogs(newExercises);
    setSummary(calculateSummary(newExercises));
    setStatus('saved');

    try {
      const exerciseType = getExerciseTypeById(newExercise.exerciseId);
      const legacyExerciseId = exerciseType?.legacy_id ?? Number(newExercise.exerciseId);
      if (!Number.isFinite(legacyExerciseId)) {
        throw new Error('No se pudo resolver exercise_id legacy para el ejercicio seleccionado');
      }

      const { error: insertError } = await ExerciseService.insertExerciseLog({
        userId: user.id,
        date,
        exerciseTypeId: newExercise.exerciseId,
        exerciseLegacyId: legacyExerciseId,
        sets: newExercise.sets || null,
        reps: newExercise.reps || null,
        duration: newExercise.duration || null,
        distance: newExercise.distance || null,
        weight: newExercise.weight || null,
        calories: newExercise.calories || null,
        steps: newExercise.steps || null,
        notes: newExercise.notes || null
      });

      if (insertError) throw insertError;

      // Reload to get the ID assigned by database
      await loadExerciseData();

      if (import.meta.env.DEV) {
        console.log('Exercise logged successfully');
      }
    } catch (error) {
      // Rollback on error
      setExerciseLogs(previousLogs);
      setSummary(calculateSummary(previousLogs));
      setError(error instanceof Error ? error.message : 'Error al guardar ejercicio');
      setStatus('error');
    }
  };

  const updateExerciseLog = async (index: number, updates: Partial<ExerciseLog>) => {
    if (!user || exerciseLogs.length === 0) return;

    setStatus('saving');
    setError(null);

    const date = getLocalDateString(selectedDate);
    const previousLogs = exerciseLogs;

    // Optimistic update
    const updatedExercises = [...exerciseLogs];
    updatedExercises[index] = { ...updatedExercises[index], ...updates };
    setExerciseLogs(updatedExercises);
    setSummary(calculateSummary(updatedExercises));
    setStatus('saved');

    try {
      // Get all logs for this date to identify which one to update
      const { data: currentLogs } = await ExerciseService.getExerciseLogIdsByDate(user.id, date);

      if (!currentLogs || currentLogs.length <= index) {
        throw new Error('Log not found');
      }

      const logId = currentLogs[index].id;
      const exerciseType = getExerciseTypeById(updatedExercises[index].exerciseId);
      const legacyExerciseId = exerciseType?.legacy_id ?? Number(updatedExercises[index].exerciseId);
      if (!Number.isFinite(legacyExerciseId)) {
        throw new Error('No se pudo resolver exercise_id legacy para actualizar el ejercicio');
      }

      const { error: updateError } = await ExerciseService.updateExerciseLogById(logId, {
        exerciseTypeId: updatedExercises[index].exerciseId,
        exerciseLegacyId: legacyExerciseId,
        sets: updatedExercises[index].sets || null,
        reps: updatedExercises[index].reps || null,
        duration: updatedExercises[index].duration || null,
        distance: updatedExercises[index].distance || null,
        weight: updatedExercises[index].weight || null,
        calories: updatedExercises[index].calories || null,
        steps: updatedExercises[index].steps || null,
        notes: updatedExercises[index].notes || null
      });

      if (updateError) throw updateError;

      if (import.meta.env.DEV) {
        console.log('Exercise log updated successfully');
      }
    } catch (error) {
      // Rollback on error
      setExerciseLogs(previousLogs);
      setSummary(calculateSummary(previousLogs));
      setError(error instanceof Error ? error.message : 'Error al actualizar ejercicio');
      setStatus('error');
    }
  };

  const deleteExerciseLog = async (index: number) => {
    if (!user || exerciseLogs.length === 0) return;

    setStatus('saving');
    setError(null);

    const date = getLocalDateString(selectedDate);
    const previousLogs = exerciseLogs;

    // Optimistic update
    const updatedExercises = exerciseLogs.filter((_, i) => i !== index);
    setExerciseLogs(updatedExercises);
    setSummary(updatedExercises.length > 0 ? calculateSummary(updatedExercises) : null);
    setStatus('saved');

    try {
      // Get all logs for this date to identify which one to delete
      const { data: currentLogs } = await ExerciseService.getExerciseLogIdsByDate(user.id, date);

      if (!currentLogs || currentLogs.length <= index) {
        throw new Error('Log not found');
      }

      const logId = currentLogs[index].id;

      const { error: deleteError } = await ExerciseService.deleteExerciseLogById(logId);

      if (deleteError) throw deleteError;

      if (import.meta.env.DEV) {
        console.log('Exercise log deleted successfully');
      }
    } catch (error) {
      // Rollback on error
      setExerciseLogs(previousLogs);
      setSummary(calculateSummary(previousLogs));
      setError(error instanceof Error ? error.message : 'Error al eliminar ejercicio');
      setStatus('error');
    }
  };

  return {
    exerciseLogs,
    summary,
    status,
    error,
    logExercise,
    updateExerciseLog,
    deleteExerciseLog,
    loadExerciseData
  };
};
