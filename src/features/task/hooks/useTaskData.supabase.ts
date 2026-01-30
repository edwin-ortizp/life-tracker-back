import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Task, TaskFormData } from '../types';
import { getCheckboxProgress } from '@/utils/markdown';
import { generateTaskCode } from '@/utils/taskCode';

type ModalMode = 'create' | 'edit' | 'complete';

export const useTaskData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const { user } = useAuth();
  const reservedTaskCodesRef = useRef<Set<number>>(new Set());

  const getPublicTasks = useCallback(() => tasks.filter(task => !task.isPrivate), [tasks]);

  const handleCloseModal = useCallback(() => {
    setShowRecurrenceModal(false);
    setCurrentTask(null);
    setStatus('idle');
    setError(null);
    setModalMode('create');
  }, []);

  const loadTasks = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const allTaskList = (data || []).map(row => ({
        id: row.id,
        taskCode: row.task_code || 0,
        title: row.title,
        description: row.description || '',
        completed: row.completed,
        createdAt: row.created_at ? { seconds: new Date(row.created_at).getTime() / 1000 } : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        startDate: row.start_date ? new Date(row.start_date) : undefined,
        endDate: row.end_date ? new Date(row.end_date) : undefined,
        isRecurrent: row.is_recurrent || false,
        isPrivate: row.is_private || false,
        category: row.category || 'other',
        priority: row.priority || 'delete',
        size: row.size || 'pequeña',
        estimatedTime: row.estimated_time,
        timeOfDay: row.time_of_day,
        elapsedSeconds: row.elapsed_seconds || 0,
        progress: typeof row.progress === 'number' ? row.progress : getCheckboxProgress(row.description || ''),
        recurrence: row.recurrence ? {
          frequency: row.recurrence.frequency,
          pattern: row.recurrence.pattern,
          customDays: row.recurrence.customDays,
          nextDate: row.recurrence.nextDate ? new Date(row.recurrence.nextDate) : undefined
        } : undefined
      })) as Task[];

      setAllTasks(allTaskList);

      const taskList = allTaskList
        .filter(task => !task.completed)
        .sort((a, b) => {
          if (a.startDate && b.startDate) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          if (a.startDate) return -1;
          if (b.startDate) return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

      setTasks(taskList);
      setStatus('saved');
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError(error instanceof Error ? error.message : 'Error loading tasks');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const getNextTaskCode = useCallback(async () => {
    if (!user) return 0;
    const reservedCodes = new Set<number>();
    reservedTaskCodesRef.current.forEach((code) => reservedCodes.add(code));
    allTasks.forEach((task) => {
      if (Number.isInteger(task.taskCode) && task.taskCode > 0) {
        reservedCodes.add(task.taskCode);
      }
    });
    const nextCode = await generateTaskCode(user.id, reservedCodes);
    reservedTaskCodesRef.current.add(nextCode);
    return nextCode;
  }, [allTasks, user]);

  const addTask = useCallback(async (formData: TaskFormData) => {
    if (!formData.title.trim() || !user) return;

    setStatus('saving');
    setError(null);
    let taskCode = 0;

    try {
      if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio');
        setStatus('error');
        return;
      }

      taskCode = await getNextTaskCode();
      const elapsedSeconds = formData.elapsedSeconds ?? 0;

      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        taskCode: taskCode,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        completed: false,
        createdAt: { seconds: Date.now() / 1000 },
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        category: formData.category || 'other',
        priority: formData.priority || 'delete',
        size: formData.size || 'pequeña',
        elapsedSeconds,
        progress: getCheckboxProgress(formData.description || ''),
        isRecurrent: formData.isRecurrent || false,
        isPrivate: formData.isPrivate || false,
        ...(formData.timeOfDay && { timeOfDay: formData.timeOfDay }),
        ...(formData.estimatedTime !== undefined && { estimatedTime: formData.estimatedTime }),
        ...(formData.recurrence && { recurrence: formData.recurrence })
      };

      setTasks(prev => [...prev, optimisticTask].sort((a, b) => {
        if (a.startDate && b.startDate) {
          return a.startDate.getTime() - b.startDate.getTime();
        }
        if (a.startDate) return -1;
        if (b.startDate) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }));
      setAllTasks(prev => [...prev, optimisticTask]);

      const taskData: any = {
        user_id: user.id,
        task_code: taskCode,
        title: formData.title.trim(),
        completed: false,
        created_at: new Date().toISOString(),
        category: formData.category || 'other',
        priority: formData.priority || 'delete',
        size: formData.size || 'pequeña',
        elapsed_seconds: elapsedSeconds,
        progress: getCheckboxProgress(formData.description || ''),
      };

      if (formData.description?.trim()) {
        taskData.description = formData.description.trim();
      }

      if (formData.startDate) {
        taskData.start_date = formData.startDate.toISOString();
      }

      if (formData.endDate) {
        taskData.end_date = formData.endDate.toISOString();
      }

      if (formData.isPrivate) {
        taskData.is_private = true;
      }

      if (formData.timeOfDay) {
        taskData.time_of_day = formData.timeOfDay;
      }

      if (formData.estimatedTime !== undefined) {
        taskData.estimated_time = formData.estimatedTime;
      }
      if (formData.elapsedSeconds !== undefined) {
        taskData.elapsed_seconds = formData.elapsedSeconds;
      }

      if (formData.isRecurrent && formData.recurrence) {
        taskData.is_recurrent = true;
        taskData.recurrence = {
          frequency: formData.recurrence.frequency,
          pattern: formData.recurrence.pattern
        };

        if (formData.recurrence.pattern === 'custom' && formData.recurrence.customDays) {
          taskData.recurrence.customDays = formData.recurrence.customDays;
        }
      }

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (insertError) throw insertError;

      setTasks(prev => prev.map(task =>
        task.id === optimisticTask.id
          ? { ...task, id: data.id }
          : task
      ));
      setAllTasks(prev => prev.map(task =>
        task.id === optimisticTask.id
          ? { ...task, id: data.id }
          : task
      ));

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Task added with ID:', data.id, 'and taskCode:', taskCode);
      }
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      if (taskCode) {
        reservedTaskCodesRef.current.delete(taskCode);
      }
      setTasks(prev => prev.filter(task => !task.id.startsWith('temp-')));
      setAllTasks(prev => prev.filter(task => !task.id.startsWith('temp-')));
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  }, [user, getNextTaskCode]);

  const editTask = useCallback(async (taskId: string, updates: Partial<TaskFormData>) => {
    if (!user) return;

    setStatus('saving');

    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    try {
      const newStartDate = updates.startDate !== undefined ? updates.startDate : originalTask.startDate;
      const newEndDate = updates.endDate !== undefined ? updates.endDate : originalTask.endDate;

      if (newStartDate && newEndDate && newEndDate < newStartDate) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio');
        setStatus('error');
        return;
      }

      const updatedTask: Task = {
        ...originalTask,
        ...(updates.title?.trim() && { title: updates.title.trim() }),
        ...(typeof updates.description === 'string' && { description: updates.description.trim() }),
        ...(updates.startDate !== undefined && { startDate: updates.startDate || undefined }),
        ...(updates.endDate !== undefined && { endDate: updates.endDate || undefined }),
        ...(updates.category && { category: updates.category }),
        ...(updates.priority && { priority: updates.priority }),
        ...(updates.size && { size: updates.size }),
        ...(updates.estimatedTime !== undefined && { estimatedTime: updates.estimatedTime }),
        ...(updates.elapsedSeconds !== undefined && { elapsedSeconds: updates.elapsedSeconds }),
        ...(updates.timeOfDay && { timeOfDay: updates.timeOfDay }),
        ...(updates.isPrivate !== undefined && { isPrivate: updates.isPrivate }),
        ...(updates.isRecurrent !== undefined && { isRecurrent: updates.isRecurrent }),
        ...(updates.recurrence && { recurrence: updates.recurrence })
      };

      updatedTask.progress = getCheckboxProgress(
        typeof updates.description === 'string'
          ? updates.description
          : originalTask.description || ''
      );

      setTasks(prev => prev.map(task =>
        task.id === taskId ? updatedTask : task
      ).sort((a, b) => {
        if (a.startDate && b.startDate) {
          return a.startDate.getTime() - b.startDate.getTime();
        }
        if (a.startDate) return -1;
        if (b.startDate) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }));
      setAllTasks(prev => prev.map(task =>
        task.id === taskId ? updatedTask : task
      ));

      const updateData: any = {
        updated_at: new Date().toISOString(),
        progress: updatedTask.progress
      };

      if (updates.title?.trim()) updateData.title = updates.title.trim();
      if (typeof updates.description === 'string') {
        updateData.description = updates.description.trim() || null;
      }
      if (updates.startDate !== undefined) {
        updateData.start_date = updates.startDate ? updates.startDate.toISOString() : null;
      }
      if (updates.endDate !== undefined) {
        updateData.end_date = updates.endDate ? updates.endDate.toISOString() : null;
      }
      if (updates.category) updateData.category = updates.category;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.size) updateData.size = updates.size;
      if (updates.estimatedTime !== undefined) updateData.estimated_time = updates.estimatedTime;
      if (updates.elapsedSeconds !== undefined) updateData.elapsed_seconds = updates.elapsedSeconds;
      if (updates.timeOfDay) updateData.time_of_day = updates.timeOfDay;
      if (updates.isPrivate !== undefined) updateData.is_private = updates.isPrivate;
      if (updates.isRecurrent !== undefined) {
        updateData.is_recurrent = updates.isRecurrent;
        if (!updates.isRecurrent) {
          updateData.recurrence = null;
        }
      }
      if (updates.recurrence) {
        updateData.recurrence = {
          frequency: updates.recurrence.frequency,
          pattern: updates.recurrence.pattern
        };
        if (updates.recurrence.pattern === 'custom' && updates.recurrence.customDays) {
          updateData.recurrence.customDays = updates.recurrence.customDays;
        }
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (updateError) throw updateError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Task updated with ID:', taskId);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error al actualizar:', error);
      setTasks(prev => prev.map(task =>
        task.id === taskId ? originalTask : task
      ));
      setAllTasks(prev => prev.map(task =>
        task.id === taskId ? originalTask : task
      ));
      setError(error instanceof Error ? error.message : 'Error al actualizar');
      setStatus('error');
    }
  }, [user, tasks, handleCloseModal]);

  const toggleTask = useCallback(async (taskId: string, completed: boolean) => {
    if (!user) return;

    setStatus('saving');

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Tarea no encontrada');

      if (!task.isRecurrent) {
        if (completed) {
          setTasks(prev => prev.filter(t => t.id !== taskId));
        }

        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            completed: completed,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId);

        if (updateError) throw updateError;

        setStatus('saved');
        if (import.meta.env.DEV) {
          console.log('Task toggled with ID:', taskId);
        }
        return;
      }

      setCurrentTask(task);
      setModalMode('complete');
      setShowRecurrenceModal(true);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      if (completed) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setTasks(prev => [...prev, task]);
        }
      }
      setError(error instanceof Error ? error.message : 'Error al actualizar');
      setStatus('error');
    }
  }, [user, tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return;

    setStatus('saving');

    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) throw deleteError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Task deleted with ID:', taskId);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      setTasks(prev => [...prev, taskToDelete].sort((a, b) => {
        if (a.startDate && b.startDate) {
          return a.startDate.getTime() - b.startDate.getTime();
        }
        if (a.startDate) return -1;
        if (b.startDate) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }));
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  }, [user, tasks]);

  const completeRecurrentTask = useCallback(async (data: TaskFormData) => {
    if (!currentTask || !user) return;

    setStatus('saving');
    let nextTaskCode = 0;

    try {
      nextTaskCode = await getNextTaskCode();

      const nextTask: Task = {
        id: `temp-${Date.now()}`,
        taskCode: nextTaskCode,
        title: currentTask.title,
        description: data.description?.trim() || currentTask.description || '',
        completed: false,
        createdAt: { seconds: Date.now() / 1000 },
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        isRecurrent: true,
        category: currentTask.category,
        priority: currentTask.priority || 'delete',
        size: currentTask.size || 'pequeña',
        elapsedSeconds: 0,
        progress: getCheckboxProgress(data.description?.trim() || currentTask.description || ''),
        isPrivate: currentTask.isPrivate || false,
        ...(data.timeOfDay && { timeOfDay: data.timeOfDay }),
        recurrence: {
          pattern: currentTask.recurrence?.pattern || 'daily',
          frequency: currentTask.recurrence?.frequency || 1,
          ...(currentTask.recurrence?.pattern === 'custom' && {
            customDays: currentTask.recurrence.customDays
          })
        }
      };

      setTasks(prev => {
        const filtered = prev.filter(t => t.id !== currentTask.id);
        return [...filtered, nextTask].sort((a, b) => {
          if (a.startDate && b.startDate) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          if (a.startDate) return -1;
          if (b.startDate) return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
      });

      await supabase
        .from('tasks')
        .update({
          completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentTask.id);

      const nextTaskData: any = {
        user_id: user.id,
        task_code: nextTaskCode,
        title: currentTask.title,
        completed: false,
        created_at: new Date().toISOString(),
        elapsed_seconds: 0,
        start_date: data.startDate ? data.startDate.toISOString() : null,
        end_date: data.endDate ? data.endDate.toISOString() : null,
        is_recurrent: true,
        category: currentTask.category,
        priority: currentTask.priority || 'delete',
        size: currentTask.size || 'pequeña',
        progress: getCheckboxProgress(data.description?.trim() || currentTask.description || ''),
        ...(data.timeOfDay && { time_of_day: data.timeOfDay }),
        recurrence: {
          pattern: currentTask.recurrence?.pattern || 'daily',
          frequency: currentTask.recurrence?.frequency || 1,
          ...(currentTask.recurrence?.pattern === 'custom' && {
            customDays: currentTask.recurrence.customDays
          })
        }
      };

      if (data.description?.trim() || currentTask.description) {
        nextTaskData.description = (data.description?.trim() || currentTask.description);
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('tasks')
        .insert(nextTaskData)
        .select()
        .single();

      if (insertError) throw insertError;

      setTasks(prev => prev.map(task =>
        task.id === nextTask.id
          ? { ...task, id: insertedData.id }
          : task
      ));

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Recurrent task completed and next created with ID:', insertedData.id, 'and taskCode:', nextTaskCode);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error al procesar tarea recurrente:', error);
      if (nextTaskCode) {
        reservedTaskCodesRef.current.delete(nextTaskCode);
      }
      setTasks(prev => {
        const filtered = prev.filter(t => !t.id.startsWith('temp-'));
        return [...filtered, currentTask].sort((a, b) => {
          if (a.startDate && b.startDate) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          if (a.startDate) return -1;
          if (b.startDate) return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
      });
      setError(error instanceof Error ? error.message : 'Error al actualizar tarea recurrente');
      setStatus('error');
    }
  }, [currentTask, user, handleCloseModal, getNextTaskCode]);

  const openCreateModal = useCallback((startDate?: Date | null, isPrivate?: boolean) => {
    setModalMode('create');
    setCurrentTask({
      id: '',
      taskCode: 0,
      title: '',
      completed: false,
      category: 'personal',
      priority: 'delete',
      size: 'pequeña',
      createdAt: { seconds: Date.now() / 1000 },
      ...(startDate ? { startDate } : {}),
      ...(isPrivate ? { isPrivate: true } : {}),
      timeOfDay: undefined,
      progress: 0
    });
    setShowRecurrenceModal(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setCurrentTask(task);
    setModalMode('edit');
    setShowRecurrenceModal(true);
    setStatus('idle');
  }, []);

  const clearCacheAndReload = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);
      await loadTasks();
    } catch (error) {
      console.error('Error reloading tasks:', error);
      setError('Error al recargar. Intenta recargar la página manualmente.');
      setStatus('error');
    }
  }, [loadTasks]);

  const publicTasks = useMemo(() => tasks.filter(task => !task.isPrivate), [tasks]);

  return useMemo(() => ({
    tasks: publicTasks,
    allTasks: allTasks,
    status,
    error,
    showRecurrenceModal,
    currentTask,
    modalMode,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    completeRecurrentTask,
    setShowRecurrenceModal: handleCloseModal,
    openEditModal,
    openCreateModal,
    getPublicTasks,
    loadTasks,
    clearCacheAndReload
  }), [
    publicTasks,
    allTasks,
    status,
    error,
    showRecurrenceModal,
    currentTask,
    modalMode,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    completeRecurrentTask,
    handleCloseModal,
    openCreateModal,
    openEditModal,
    getPublicTasks,
    loadTasks,
    clearCacheAndReload
  ]);
};
