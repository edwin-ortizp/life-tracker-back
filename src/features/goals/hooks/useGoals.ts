import { useEffect, useState, useCallback } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestoreLogger } from '@/utils/firestore-logger';
import type { Goal, GoalEntry, GoalTask, GoalsHook, NumericEntry } from '../types';

export const useGoals = (): GoalsHook => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    setError(null);
    try {
      firestoreLogger.logRead('goals', 'useGoals.loadGoals');
      const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const list: Goal[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          status: data.status,
          startDate: data.startDate || null,
          dueDate: data.dueDate || null,
          tasks: data.tasks || [],
          entries: data.entries || [],
          positiveCount: data.positiveCount || 0,
          negativeCount: data.negativeCount || 0,
          numericGoal: data.numericGoal || undefined,
          numericEntries: data.numericEntries || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Goal;
      });
      setGoals(list);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      return;
    }
    loadGoals();
  }, [user, loadGoals]);

  const addGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    setStatus('saving');
    setError(null);
    try {
      const docData: any = {
        ...goalData,
        userId: user.uid,
        positiveCount: 0,
        negativeCount: 0,
        numericEntries: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      firestoreLogger.logWrite('goals', 'useGoals.addGoal');
      const docRef = await addDoc(collection(db, 'goals'), docData);
      setGoals(prev => [
        ...prev,
        {
          ...goalData,
          id: docRef.id,
          userId: user.uid,
          positiveCount: 0,
          negativeCount: 0,
          numericEntries: [],
          createdAt: '',
          updatedAt: ''
        }
      ]);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    if (!user) return;
    setStatus('saving');
    setError(null);
    const original = goals.find(g => g.id === id);
    if (!original) return;
    const updatedGoal = { ...original, ...data };
    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
    try {
      const docRef = doc(db, 'goals', id);
      const updateData: any = { ...data, updatedAt: serverTimestamp() };
      firestoreLogger.logWrite('goals', 'useGoals.updateGoal', id);
      await updateDoc(docRef, updateData);
      setStatus('idle');
    } catch (err) {
      setGoals(prev => prev.map(g => g.id === id ? original : g));
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const addTask = async (goalId: string, taskTitle: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const newTask: GoalTask = { title: taskTitle, done: false, createdAt: new Date().toISOString() };
    const updatedTasks = [...goal.tasks, newTask];
    await updateGoal(goalId, { tasks: updatedTasks });
  };

  const toggleTask = async (goalId: string, taskIndex: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const tasks = [...goal.tasks];
    const task = tasks[taskIndex];
    if (!task) return;
    tasks[taskIndex] = {
      ...task,
      done: !task.done,
      completedAt: !task.done ? new Date().toISOString() : null
    };
    await updateGoal(goalId, { tasks });
  };

  const addEntry = async (goalId: string, entry: Omit<GoalEntry, 'date'> & { date?: string }) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const newEntry: GoalEntry = {
      text: entry.text,
      date: entry.date || new Date().toISOString(),
      isMilestone: entry.isMilestone
    };
    const entries = [...goal.entries, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    await updateGoal(goalId, { entries });
  };

  const incrementPositiveCount = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const newCount = (goal.positiveCount || 0) + 1;
    await updateGoal(goalId, { positiveCount: newCount });
  };

  const incrementNegativeCount = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const newCount = (goal.negativeCount || 0) + 1;
    await updateGoal(goalId, { negativeCount: newCount });
  };

  const addNumericEntry = async (goalId: string, entry: Omit<NumericEntry, 'date'> & { date?: string }) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const newEntry: NumericEntry = {
      value: entry.value,
      date: entry.date || new Date().toISOString(),
      note: entry.note
    };
    const numericEntries = [...(goal.numericEntries || []), newEntry].sort((a, b) => a.date.localeCompare(b.date));
    
    // Update current value in numeric goal
    const updatedNumericGoal = goal.numericGoal ? {
      ...goal.numericGoal,
      currentValue: entry.value
    } : undefined;
    
    await updateGoal(goalId, { 
      numericEntries, 
      numericGoal: updatedNumericGoal 
    });
  };

  return {
    goals,
    status,
    error,
    addGoal,
    updateGoal,
    addTask,
    toggleTask,
    addEntry,
    incrementPositiveCount,
    incrementNegativeCount,
    addNumericEntry,
    loadGoals
  };
};
