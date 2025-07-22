import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, isFirestoreInternalError, clearOfflineCache } from '@/firebase';
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

  // Función para obtener solo tareas públicas (no privadas) - memoizada
  const getPublicTasks = useCallback(() => tasks.filter(task => !task.isPrivate), [tasks]);

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
      const allTaskList = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            taskCode: data.taskCode || 0, // Manejar tareas existentes sin taskCode
            title: data.title,
            description: data.description || '',
            completed: data.completed,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt?.toDate(),
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
        });

      // Guardar todas las tareas (incluyendo completadas)
      setAllTasks(allTaskList);
      
      // Filtrar solo tareas no completadas para la vista principal
      const taskList = allTaskList
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
      
      // Verificar si es un error interno de Firestore
      if (isFirestoreInternalError(error)) {
        console.warn('Firestore internal error detected. This may require cache clearing.');
        setError('Error de sincronización detectado. Puedes intentar limpiar el cache offline si el problema persiste.');
      } else {
        setError(error instanceof Error ? error.message : 'Error loading tasks');
      }
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (formData: TaskFormData) => {
    if (!formData.title.trim() || !user) return;

    setStatus('saving');
    setError(null);

    try {
      // Generar taskCode único
      const taskCode = await generateTaskCode(user.uid);

      // Crear optimistically la nueva tarea
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`, // ID temporal
        taskCode: taskCode,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        completed: false,
        createdAt: { seconds: Date.now() / 1000 },
        dueDate: formData.dueDate || undefined,
        category: formData.category || 'other',
        priority: formData.priority || 'delete',
        size: formData.size || 'pequeña',
        elapsedSeconds: 0,
        progress: getCheckboxProgress(formData.description || ''),
        isRecurrent: formData.isRecurrent || false,
        isPrivate: formData.isPrivate || false,
        ...(formData.timeOfDay && { timeOfDay: formData.timeOfDay }),
        ...(formData.estimatedTime !== undefined && { estimatedTime: formData.estimatedTime }),
        ...(formData.recurrence && { recurrence: formData.recurrence })
      };

      // Actualización optimista
      setTasks(prev => [...prev, optimisticTask].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }));

      const taskData: any = {
        userId: user.uid,
        taskCode: taskCode,
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
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      
      // Actualizar con el ID real del documento
      setTasks(prev => prev.map(task => 
        task.id === optimisticTask.id 
          ? { ...task, id: docRef.id }
          : task
      ));
      
      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Task added with ID:', docRef.id, 'and taskCode:', taskCode);
      }
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      
      // Verificar si es un error interno de Firestore
      if (isFirestoreInternalError(error)) {
        console.warn('Firestore internal error detected during task creation.');
        setError('Error de sincronización. La tarea puede haberse guardado pero hay un problema con el cache local.');
        // No revertir inmediatamente, dar oportunidad de que se sincronice
        setTimeout(() => {
          loadTasks(); // Recargar tareas después de un momento
        }, 2000);
      } else {
        // Revertir actualización optimista en caso de error normal
        // Solo revertir si optimisticTask está definido
        if (error instanceof Error && error.message.includes('taskCode')) {
          setError('Error al generar código de tarea único');
        } else {
          setTasks(prev => prev.filter(task => task.id.startsWith('temp-')));
          setError(error instanceof Error ? error.message : 'Error al guardar');
        }
      }
      setStatus('error');
    }
  }, [user]);

  const editTask = useCallback(async (taskId: string, updates: Partial<TaskFormData>) => {
    if (!user) return;

    setStatus('saving');
    
    // Guardar tarea original para revertir si falla
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    try {
      // Actualización optimista
      const updatedTask: Task = {
        ...originalTask,
        ...(updates.title?.trim() && { title: updates.title.trim() }),
        ...(typeof updates.description === 'string' && { description: updates.description.trim() }),
        ...(updates.dueDate !== undefined && { dueDate: updates.dueDate || undefined }),
        ...(updates.category && { category: updates.category }),
        ...(updates.priority && { priority: updates.priority }),
        ...(updates.size && { size: updates.size }),
        ...(updates.estimatedTime !== undefined && { estimatedTime: updates.estimatedTime }),
        ...(updates.timeOfDay && { timeOfDay: updates.timeOfDay }),
        ...(updates.isPrivate !== undefined && { isPrivate: updates.isPrivate }),
        ...(updates.isRecurrent !== undefined && { isRecurrent: updates.isRecurrent }),
        ...(updates.recurrence && { recurrence: updates.recurrence })
      };

      // Actualizar progreso basado en checkboxes
      updatedTask.progress = getCheckboxProgress(
        typeof updates.description === 'string'
          ? updates.description
          : originalTask.description || ''
      );

      // Actualizar localmente
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ).sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }));

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

      updateData.progress = updatedTask.progress;

      firestoreLogger.logWrite('tasks', 'useTaskData.editTask', taskId);
      await updateDoc(taskRef, updateData);
      
      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Task updated with ID:', taskId);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error al actualizar:', error);
      // Revertir actualización optimista en caso de error
      setTasks(prev => prev.map(task => 
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
        // Actualización optimista - remover de la lista si se completa
        if (completed) {
          setTasks(prev => prev.filter(t => t.id !== taskId));
        }

        const taskRef = doc(db, 'tasks', taskId);
        firestoreLogger.logWrite('tasks', 'useTaskData.toggleTask', taskId);
        await updateDoc(taskRef, {
          completed: completed,
          updatedAt: serverTimestamp()
        });
        
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
      // Revertir actualización optimista en caso de error
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
    
    // Guardar la tarea para poder revertir si falla
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;
    
    try {
      // Actualización optimista - remover de la lista inmediatamente
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      firestoreLogger.logDelete('tasks', 'useTaskData.deleteTask', taskId);
      await deleteDoc(doc(db, 'tasks', taskId));
      
      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Task deleted with ID:', taskId);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      // Revertir actualización optimista en caso de error
      setTasks(prev => [...prev, taskToDelete].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }));
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  }, [user, tasks]);

  const completeRecurrentTask = useCallback(async (data: TaskFormData) => {
    if (!currentTask || !user) return;

    setStatus('saving');
    
    try {
      // Generar taskCode único para la nueva tarea recurrente
      const nextTaskCode = await generateTaskCode(user.uid);

      // Crear la siguiente tarea optimistically
      const nextTask: Task = {
        id: `temp-${Date.now()}`,
        taskCode: nextTaskCode,
        title: currentTask.title,
        description: data.description?.trim() || currentTask.description || '',
        completed: false,
        createdAt: { seconds: Date.now() / 1000 },
        dueDate: data.dueDate || undefined,
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

      // Actualización optimista - remover tarea actual y agregar siguiente
      setTasks(prev => {
        const filtered = prev.filter(t => t.id !== currentTask.id);
        return [...filtered, nextTask].sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return a.dueDate.getTime() - b.dueDate.getTime();
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
      });

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
        taskCode: nextTaskCode,
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
      const docRef = await addDoc(collection(db, 'tasks'), nextTaskData);
      
      // Actualizar con el ID real del documento
      setTasks(prev => prev.map(task => 
        task.id === nextTask.id 
          ? { ...task, id: docRef.id }
          : task
      ));
      
      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Recurrent task completed and next created with ID:', docRef.id, 'and taskCode:', nextTaskCode);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error al procesar tarea recurrente:', error);
      // Revertir actualización optimista en caso de error
      if (error instanceof Error && error.message.includes('taskCode')) {
        setError('Error al generar código de tarea recurrente');
      } else {
        setTasks(prev => {
          const filtered = prev.filter(t => t.id.startsWith('temp-'));
          return [...filtered, currentTask].sort((a, b) => {
            if (a.dueDate && b.dueDate) {
              return a.dueDate.getTime() - b.dueDate.getTime();
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
          });
        });
        setError(error instanceof Error ? error.message : 'Error al actualizar tarea recurrente');
      }
      setStatus('error');
    }
  }, [currentTask, user, handleCloseModal]);

  const openCreateModal = useCallback((dueDate?: Date | null, isPrivate?: boolean) => {
    setModalMode('create');
    setCurrentTask({
      id: '',
      taskCode: 0, // Se generará al guardar
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

  const openEditModal = useCallback((task: Task) => {
    setCurrentTask(task);
    setModalMode('edit');
    setShowRecurrenceModal(true);
    setStatus('idle'); // Asegurarnos de que el estado esté en idle al abrir el modal
  }, []);

  const resync = useResync('Task data');

  // Función para limpiar cache cuando hay errores de sincronización
  const clearCacheAndReload = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);
      await clearOfflineCache();
    } catch (error) {
      console.error('Error clearing cache:', error);
      setError('Error al limpiar el cache. Intenta recargar la página manualmente.');
      setStatus('error');
    }
  }, []);

  // Memoizar tareas públicas para evitar recálculos innecesarios
  const publicTasks = useMemo(() => tasks.filter(task => !task.isPrivate), [tasks]);

  // Memoizar objeto de retorno para evitar re-renders innecesarios
  return useMemo(() => ({
    tasks: publicTasks, // Solo devolver tareas públicas por defecto
    allTasks: allTasks, // Todas las tareas (incluyendo completadas) para widgets
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
    resync,
    clearCacheAndReload
  }), [
    publicTasks,
    tasks,
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
    getPublicTasks,
    loadTasks,
    resync,
    clearCacheAndReload
  ]);
};