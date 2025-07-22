import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { firestoreLogger } from '@/utils/firestore-logger';
import type { Task } from '../types';
import { getCheckboxProgress } from '@/utils/markdown';

/**
 * Hook to fetch a task by its taskCode
 * @param taskCode - The 5-digit task code to search for
 * @returns Object with task data, loading state, and error
 */
export const useTaskByCode = (taskCode: number | string) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTaskByCode = useCallback(async () => {
    if (!user || !taskCode) {
      setTask(null);
      setLoading(false);
      return;
    }

    // Convert taskCode to number if it's a string
    const codeAsNumber = typeof taskCode === 'string' ? parseInt(taskCode, 10) : taskCode;
    
    // Validate taskCode format (5 digits: 10000-99999)
    if (isNaN(codeAsNumber) || codeAsNumber < 10000 || codeAsNumber > 99999) {
      setError('Código de tarea inválido. Debe ser un número de 5 dígitos.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      firestoreLogger.logRead('tasks', `useTaskByCode.fetchTaskByCode - taskCode: ${codeAsNumber}`);
      
      const tasksRef = collection(db, 'tasks');
      const taskQuery = query(
        tasksRef,
        where('userId', '==', user.uid),
        where('taskCode', '==', codeAsNumber),
        limit(1) // Should only be one task with this code per user
      );

      const querySnapshot = await getDocs(taskQuery);

      if (querySnapshot.empty) {
        setError('Tarea no encontrada');
        setTask(null);
        setLoading(false);
        return;
      }

      // Get the first (and should be only) result
      const doc = querySnapshot.docs[0];
      const data = doc.data();

      const taskData: Task = {
        id: doc.id,
        taskCode: data.taskCode || 0,
        title: data.title,
        description: data.description || '',
        completed: data.completed,
        createdAt: data.createdAt,
        dueDate: data.dueDate?.toDate(),
        isRecurrent: data.isRecurrent || false,
        isPrivate: data.isPrivate || false,
        category: data.category || 'other',
        priority: data.priority || 'delete',
        size: data.size || 'pequeña',
        estimatedTime: data.estimatedTime,
        timeOfDay: data.timeOfDay,
        elapsedSeconds: data.elapsedSeconds || 0,
        progress:
          typeof data.progress === 'number'
            ? data.progress
            : getCheckboxProgress(data.description || ''),
        // Timer-related fields
        timerStartTime: data.timerStartTime,
        timerPaused: data.timerPaused || false,
        pausedDuration: data.pausedDuration || 0,
        timerActive: data.timerActive || false,
        recurrence: data.recurrence ? {
          frequency: data.recurrence.frequency,
          pattern: data.recurrence.pattern,
          customDays: data.recurrence.customDays,
          nextDate: data.recurrence.nextDate?.toDate()
        } : undefined
      };

      setTask(taskData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching task by code:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la tarea');
      setTask(null);
      setLoading(false);
    }
  }, [user, taskCode]);

  useEffect(() => {
    fetchTaskByCode();
  }, [fetchTaskByCode]);

  return {
    task,
    loading,
    error,
    refetch: fetchTaskByCode
  };
};