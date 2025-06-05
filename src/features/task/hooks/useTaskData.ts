import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import type { Task, TaskFormData } from '../types';

type ModalMode = 'create' | 'edit' | 'complete';

export const useTaskData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
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

  // Cargar las tareas del usuario
  // y sus actualizaciones en tiempo real
  useEffect(() => {
    if (!user) return;

    setStatus('loading');
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const taskList = snapshot.docs
          .map(doc => {
            const data = doc.data();            return {
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
              size: data.size || 'peque\u00f1a',
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
        // Solo cambiar a 'saved' si no estamos en proceso de guardar
        if (status !== 'saving') {
          setStatus('idle');
        }
      },
      (error) => {
        console.error('Error en snapshot:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addTask = async (formData: TaskFormData) => {
    if (!formData.title.trim() || !user) return;

    setStatus('saving');
    setError(null);

    try {      const taskData: any = {
        userId: user.uid,
        title: formData.title.trim(),
        completed: false,
        createdAt: serverTimestamp(),
        category: formData.category || 'other',
        priority: formData.priority || 'delete',
        size: formData.size || 'peque\u00f1a'
      };

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

      await addDoc(collection(db, 'tasks'), taskData);
      setStatus('idle');
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
      }      if (updates.size) {
        updateData.size = updates.size;
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

      await updateDoc(taskRef, updateData);
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
        await updateDoc(taskRef, {
          completed: !completed,
          updatedAt: serverTimestamp()
        });
        setStatus('idle');
        return;
      }

      setCurrentTask(task);
      setModalMode('complete');
      setShowRecurrenceModal(true);
      setStatus('idle');
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
      await deleteDoc(doc(db, 'tasks', taskId));
      setStatus('idle');
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
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
        isRecurrent: true,
        category: currentTask.category,
        priority: currentTask.priority || 'delete',
        size: currentTask.size || 'peque\u00f1a',
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

      await addDoc(collection(db, 'tasks'), nextTaskData);

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
      size: 'peque\u00f1a',
      createdAt: { seconds: Date.now() / 1000 },
      ...(dueDate ? { dueDate } : {}),
      ...(isPrivate ? { isPrivate: true } : {})
    });
    setShowRecurrenceModal(true);
  }, []);

  const openEditModal = (task: Task) => {
    setCurrentTask(task);
    setModalMode('edit');
    setShowRecurrenceModal(true);
    setStatus('idle'); // Asegurarnos de que el estado esté en idle al abrir el modal
  };
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
    getPublicTasks
  };
};