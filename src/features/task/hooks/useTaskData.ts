// src/features/task/hooks/useTaskData.ts
import { useState, useEffect } from 'react';
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
  serverTimestamp 
} from 'firebase/firestore';
import type { Task, TaskFormData } from '../types';

export const useTaskData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<'complete' | 'edit'>('complete');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
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
              recurrence: data.recurrence ? {
                frequency: data.recurrence.frequency,
                pattern: data.recurrence.pattern,
                customDays: data.recurrence.customDays,
                nextDate: data.recurrence.nextDate?.toDate()
              } : undefined
            };
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

    try {
      // Creamos el objeto base
      const taskData: any = {
        userId: user.uid,
        title: formData.title.trim(),
        completed: false,
        createdAt: serverTimestamp()
      };

      // Solo agregamos description si tiene valor
      if (formData.description?.trim()) {
        taskData.description = formData.description.trim();
      }

      // Solo agregamos dueDate si existe
      if (formData.dueDate) {
        taskData.dueDate = formData.dueDate;
      }

      // Solo agregamos recurrence si la tarea es recurrente y tiene configuración
      if (formData.isRecurrent && formData.recurrence) {
        taskData.isRecurrent = true;
        taskData.recurrence = {
          frequency: formData.recurrence.frequency,
          pattern: formData.recurrence.pattern
        };
        
        // Solo agregamos customDays si el patrón es custom
        if (formData.recurrence.pattern === 'custom' && formData.recurrence.customDays) {
          taskData.recurrence.customDays = formData.recurrence.customDays;
        }
      }

      await addDoc(collection(db, 'tasks'), taskData);
      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const editTask = async (taskId: string, updates: Partial<TaskFormData>) => {
    if (!user) return;

    setStatus('saving');
    try {
      const taskRef = doc(db, 'tasks', taskId);
      
      // Creamos un objeto con las actualizaciones, excluyendo campos undefined
      const updateData: any = { updatedAt: serverTimestamp() };
      
      if (updates.title?.trim()) updateData.title = updates.title.trim();
      if (typeof updates.description === 'string') {
        updateData.description = updates.description.trim() || null;
      }
      if (updates.dueDate !== undefined) {
        updateData.dueDate = updates.dueDate || null;
      }
      if (updates.isRecurrent !== undefined) {
        updateData.isRecurrent = updates.isRecurrent;
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
      setStatus('saved');
    } catch (error) {
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
        return;
      }

      setCurrentTask(task);
      setModalMode('complete');
      setShowRecurrenceModal(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const completeRecurrentTask = async (data: { nextDate: Date, description?: string }) => {
    if (!currentTask || !user) return;

    setStatus('saving');
    try {
      const taskRef = doc(db, 'tasks', currentTask.id);
      
      // Actualizamos la tarea actual
      await updateDoc(taskRef, {
        completed: true,
        updatedAt: serverTimestamp()
      });

      // Creamos el objeto para la nueva tarea
      const newTaskData: any = {
        userId: user.uid,
        title: currentTask.title,
        completed: false,
        createdAt: serverTimestamp(),
        dueDate: data.nextDate,
        isRecurrent: true,
        recurrence: currentTask.recurrence
      };

      // Solo incluimos description si tiene valor
      if (data.description?.trim()) {
        newTaskData.description = data.description.trim();
      } else if (currentTask.description) {
        newTaskData.description = currentTask.description;
      }

      await addDoc(collection(db, 'tasks'), newTaskData);

      setStatus('saved');
      setCurrentTask(null);
      setShowRecurrenceModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar tarea recurrente');
      setStatus('error');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    setStatus('saving');
    
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const openEditModal = (task: Task) => {
    setCurrentTask(task);
    setModalMode('edit');
    setShowRecurrenceModal(true);
  };

  return {
    tasks,
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
    setShowRecurrenceModal,
    openEditModal
  };
};