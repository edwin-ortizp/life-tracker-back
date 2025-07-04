import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';
import { firestoreLogger } from '@/utils/firestore-logger';
import type { Task, TaskFormData } from '../types';
import { getCheckboxProgress } from '@/utils/markdown';

type ModalMode = 'create' | 'edit' | 'complete';

export const useTaskData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const { user } = useAuth();

  // Función para obtener solo tareas públicas (no privadas)
  const getPublicTasks = () => tasks.filter(task => !task.isPrivate);

  // Manejar el cierre del modal
  const handleCloseModal = useCallback(() => {
    setShowRecurrenceModal(false);
    setCurrentTask(null);
    setStatus('idle'); // Resetear el estado al cerrar el modal
    setError(null);
    setModalMode('create');
  }, []);

  // Cargar las tareas del usuario (carga inicial única)
  const loadTasks = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      firestoreLogger.logRead('tasks', 'useTaskData.loadTasks');
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const taskList = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
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
            recurrence: data.recurrence ? {
              frequency: data.recurrence.frequency,
              pattern: data.recurrence.pattern,
              customDays: data.recurrence.customDays,
              nextDate: data.recurrence.nextDate?.toDate()
            } : undefined
          } as Task;
        })
        .filter(task => !task.completed)
        .sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return a.dueDate.getTime() - b.dueDate.getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
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

  const addTask = async (formData: TaskFormData) => {
    if (!formData.title.trim() || !user) return;

    setStatus('saving');
    setError(null);

    try {
      const taskData: any = {
        userId: user.uid,
        title: formData.title.trim(),
        completed: false,
        createdAt: serverTimestamp(),
        category: formData.category || 'other',
        priority: formData.priority || 'delete',
        size: formData.size || 'pequeña',
        elapsedSeconds: 0,
        ...(formData.timeOfDay && { timeOfDay: formData.timeOfDay }),
        ...(formData.estimatedTime !== undefined && { estimatedTime: formData.estimatedTime }),
      };
      taskData.progress = getCheckboxProgress(formData.description || '');

      if (formData.description?.trim()) {
        taskData.description = formData.description.trim();
      }

      if (formData.dueDate) {
        taskData.dueDate = Timestamp.fromDate(formData.dueDate);
      }

      if (formData.isPrivate) {
        taskData.isPrivate = true;
      }

      if (formData.isRecurrent && formData.recurrence) {
        taskData.isRecurrent = true;
        taskData.recurrence = {
          frequency: formData.recurrence.frequency,
          pattern: formData.recurrence.pattern
        };
        
        if (formData.recurrence.pattern === 'custom' && formData.recurrence.customDays) {
          taskData.recurrence.customDays = formData.recurrence.customDays;
        }
      }

      firestoreLogger.logWrite('tasks', 'useTaskData.addTask');
      await addDoc(collection(db, 'tasks'), taskData);
      
      // Recargar tareas después de agregar
      await loadTasks();
      
      if (import.meta.env.DEV) {
        console.log('Task added locally');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const editTask = async (taskId: string, updates: Partial<TaskFormData>) => {
    if (!user) return;

    setStatus('saving');
    try {
      const taskRef = doc(db, 'tasks', taskId);

      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      if (updates.title?.trim()) updateData.title = updates.title.trim();
      if (typeof updates.description === 'string') {
        updateData.description = updates.description.trim() || null;
      }
      if (updates.dueDate !== undefined) {
        updateData.dueDate = updates.dueDate ? Timestamp.fromDate(updates.dueDate) : null;
      }
      if (updates.category) {
        updateData.category = updates.category;
      }
      if (updates.priority) {
        updateData.priority = updates.priority;
      }
      if (updates.size) {
        updateData.size = updates.size;
      }
      if (updates.estimatedTime !== undefined) {
        updateData.estimatedTime = updates.estimatedTime;
      }
      if (updates.timeOfDay) {
        updateData.timeOfDay = updates.timeOfDay;
      }
      if (updates.isPrivate !== undefined) {
        updateData.isPrivate = updates.isPrivate;
      }
      if (updates.isRecurrent !== undefined) {
        updateData.isRecurrent = updates.isRecurrent;
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

      const existing = tasks.find(t => t.id === taskId);
      updateData.progress = getCheckboxProgress(
        typeof updates.description === 'string'
          ? updates.description
          : existing?.description || ''
      );

      firestoreLogger.logWrite('tasks', 'useTaskData.editTask', taskId);
      await updateDoc(taskRef, updateData);
      
      // Recargar tareas después de editar
      await loadTasks();
      
      if (import.meta.env.DEV) {
        console.log('Task updated locally');
      }
      handleCloseModal(); // Cerrar el modal después de guardar exitosamente
    } catch (error) {
      console.error('Error al actualizar:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!user) return;

    setStatus('saving');
    
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Tarea no encontrada');
      
      if (!task.isRecurrent) {
        const taskRef = doc(db, 'tasks', taskId);
        firestoreLogger.logWrite('tasks', 'useTaskData.toggleTask', taskId);
        await updateDoc(taskRef, {
          completed: completed,
          updatedAt: serverTimestamp()
        });
        
        // Recargar tareas después de toggle
        await loadTasks();
        
        if (import.meta.env.DEV) {
          console.log('Task toggled locally');
        }
        return;
      }

      setCurrentTask(task);
      setModalMode('complete');
      setShowRecurrenceModal(true);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    setStatus('saving');
    
    try {
      firestoreLogger.logDelete('tasks', 'useTaskData.deleteTask', taskId);
      await deleteDoc(doc(db, 'tasks', taskId));
      
      // Recargar tareas después de eliminar
      await loadTasks();
      
      if (import.meta.env.DEV) {
        console.log('Task deleted locally');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const completeRecurrentTask = async (data: TaskFormData) => {
    if (!currentTask || !user) return;

    setStatus('saving');
    try {
      const taskRef = doc(db, 'tasks', currentTask.id);
      
      // Marcamos la tarea actual como completada
      firestoreLogger.logWrite('tasks', 'useTaskData.completeRecurrentTask', currentTask.id);
      await updateDoc(taskRef, {
        completed: true,
        updatedAt: serverTimestamp()
      });

      // Creamos la siguiente ocurrencia
      const nextTaskData: any = {
        userId: user.uid,
        title: currentTask.title,
        completed: false,
        createdAt: serverTimestamp(),
        elapsedSeconds: 0,
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
        isRecurrent: true,
        category: currentTask.category,
        priority: currentTask.priority || 'delete',
        size: currentTask.size || 'pequeña',
        ...(data.timeOfDay && { timeOfDay: data.timeOfDay }),
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

      nextTaskData.progress = getCheckboxProgress(nextTaskData.description || '');

      firestoreLogger.logWrite('tasks', 'useTaskData.completeRecurrentTask.next');
      await addDoc(collection(db, 'tasks'), nextTaskData);
      
      // Recargar tareas después de completar recurrente
      await loadTasks();
      
      if (import.meta.env.DEV) {
        console.log('Next task created locally');
      }

      handleCloseModal(); // Usar el nuevo manejador de cierre
    } catch (error) {
      console.error('Error al procesar tarea recurrente:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar tarea recurrente');
      setStatus('error');
    }
  };

  const openCreateModal = useCallback((dueDate?: Date | null, isPrivate?: boolean) => {
    setModalMode('create');
    setCurrentTask({
      id: '',
      title: '',
      completed: false,
      category: 'personal',
      priority: 'delete',
      size: 'pequeña',
      createdAt: { seconds: Date.now() / 1000 },
      ...(dueDate ? { dueDate } : {}),
      ...(isPrivate ? { isPrivate: true } : {}),
      timeOfDay: undefined,
      progress: 0
    });
    setShowRecurrenceModal(true);
  }, []);

  const openEditModal = (task: Task) => {
    setCurrentTask(task);
    setModalMode('edit');
    setShowRecurrenceModal(true);
    setStatus('idle'); // Asegurarnos de que el estado esté en idle al abrir el modal
  };

  const resync = useResync('Task data');
  
  return {
    tasks: getPublicTasks(), // Solo devolver tareas públicas por defecto
    allTasks: tasks, // Disponible para casos especiales como PrivateTaskSection
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
    loadTasks, // Exponer función de recarga manual
    resync
  };
};