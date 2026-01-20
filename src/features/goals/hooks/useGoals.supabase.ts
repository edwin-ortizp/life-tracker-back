import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { generateTaskCode } from '@/utils/taskCode';
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
      // Load goals with related data
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;

      // Load all related tasks, entries, and numeric entries
      const goalIds = (goalsData || []).map(g => g.id);

      const safeSelectByGoalIds = async (table: string) => {
        if (goalIds.length === 0) {
          return { data: [], error: null as any };
        }
        const result = await supabase.from(table).select('*').in('goal_id', goalIds);
        if (result.status === 404) {
          // Table not available in current backend; treat as empty to avoid blocking goals.
          return { data: [], error: null as any };
        }
        return result;
      };

      const tasksPromise = goalIds.length === 0
        ? Promise.resolve({ data: [], error: null as any })
        : supabase
          .from('tasks')
          .select('id, goal_id, title, completed, created_at, updated_at')
          .eq('user_id', user.id)
          .in('goal_id', goalIds);

      const [tasksResult, entriesResult, numericEntriesResult] = await Promise.all([
        tasksPromise,
        safeSelectByGoalIds('goal_entries'),
        safeSelectByGoalIds('goal_numeric_entries')
      ]);

      if (tasksResult.error) throw tasksResult.error;

      // Group by goal_id
      const tasksByGoal: Record<string, GoalTask[]> = {};
      const entriesByGoal: Record<string, GoalEntry[]> = {};
      const numericEntriesByGoal: Record<string, NumericEntry[]> = {};

      (tasksResult.data || []).forEach(t => {
        if (!tasksByGoal[t.goal_id]) tasksByGoal[t.goal_id] = [];
        tasksByGoal[t.goal_id].push({
          id: t.id,
          title: t.title,
          done: !!t.completed,
          createdAt: t.created_at,
          completedAt: t.completed ? t.updated_at || null : null
        });
      });

      (entriesResult.data || []).forEach(e => {
        if (!entriesByGoal[e.goal_id]) entriesByGoal[e.goal_id] = [];
        entriesByGoal[e.goal_id].push({
          text: e.text,
          date: e.date,
          isMilestone: e.is_milestone
        });
      });

      (numericEntriesResult.data || []).forEach(ne => {
        if (!numericEntriesByGoal[ne.goal_id]) numericEntriesByGoal[ne.goal_id] = [];
        numericEntriesByGoal[ne.goal_id].push({
          value: ne.value,
          date: ne.date,
          note: ne.note
        });
      });

      // Combine all data
      const list: Goal[] = (goalsData || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        status: row.status,
        startDate: row.start_date || null,
        dueDate: row.due_date || null,
        tasks: tasksByGoal[row.id] || [],
        entries: entriesByGoal[row.id] || [],
        positiveCount: row.positive_count || 0,
        negativeCount: row.negative_count || 0,
        numericGoal: row.numeric_goal || undefined,
        numericEntries: numericEntriesByGoal[row.id] || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      } as Goal));

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
      const { data, error: insertError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goalData.title,
          description: goalData.description || null,
          status: goalData.status,
          start_date: goalData.startDate || null,
          due_date: goalData.dueDate || null,
          positive_count: 0,
          negative_count: 0,
          numeric_goal: goalData.numericGoal || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state
      setGoals(prev => [
        ...prev,
        {
          ...goalData,
          id: data.id,
          userId: user.id,
          positiveCount: 0,
          negativeCount: 0,
          numericEntries: [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
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
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
      if (data.positiveCount !== undefined) updateData.positive_count = data.positiveCount;
      if (data.negativeCount !== undefined) updateData.negative_count = data.negativeCount;
      if (data.numericGoal !== undefined) updateData.numeric_goal = data.numericGoal;

      const { error: updateError } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

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

    try {
      const taskCode = await generateTaskCode(user.id);
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          goal_id: goalId,
          task_code: taskCode,
          title: taskTitle,
          completed: false,
          category: 'other',
          priority: 'delete',
          size: 'pequeña',
          progress: 0,
          is_private: false,
          is_recurrent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Reload goals
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar tarea');
      setStatus('error');
    }
  };

  const toggleTask = async (goalId: string, taskId: string | undefined, taskIndex: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;
    const task = goal.tasks[taskIndex];
    if (!task) return;

    try {
      let resolvedTaskId = taskId || task.id;
      if (!resolvedTaskId) {
        // Fallback: resolve task id by goal/title ordering.
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('goal_id', goalId)
          .eq('title', task.title)
          .order('created_at', { ascending: true });

        if (!tasks || tasks.length <= taskIndex) return;
        resolvedTaskId = tasks[taskIndex].id;
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          completed: !task.done,
          updated_at: new Date().toISOString()
        })
        .eq('id', resolvedTaskId);

      if (updateError) throw updateError;

      // Reload goals
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tarea');
      setStatus('error');
    }
  };

  const editTask = async (goalId: string, taskId: string, title: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user || !taskId) return;

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tarea');
      setStatus('error');
    }
  };

  const deleteTask = async (goalId: string, taskId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user || !taskId) return;

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar tarea');
      setStatus('error');
    }
  };

  const addEntry = async (goalId: string, entry: Omit<GoalEntry, 'date'> & { date?: string }) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !user) return;

    try {
      const { error: insertError } = await supabase
        .from('goal_entries')
        .insert({
          goal_id: goalId,
          text: entry.text,
          date: entry.date || new Date().toISOString(),
          is_milestone: entry.isMilestone
        });

      if (insertError) throw insertError;

      // Reload goals
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar entrada');
      setStatus('error');
    }
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

    try {
      const { error: insertError } = await supabase
        .from('goal_numeric_entries')
        .insert({
          goal_id: goalId,
          value: entry.value,
          date: entry.date || new Date().toISOString(),
          note: entry.note || null
        });

      if (insertError) throw insertError;

      // Update current value in numeric goal
      const updatedNumericGoal = goal.numericGoal ? {
        ...goal.numericGoal,
        currentValue: entry.value
      } : undefined;

      await updateGoal(goalId, { numericGoal: updatedNumericGoal });

      // Reload goals
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar entrada numérica');
      setStatus('error');
    }
  };

  return {
    goals,
    status,
    error,
    addGoal,
    updateGoal,
    addTask,
    toggleTask,
    editTask,
    deleteTask,
    addEntry,
    incrementPositiveCount,
    incrementNegativeCount,
    addNumericEntry,
    loadGoals
  };
};
