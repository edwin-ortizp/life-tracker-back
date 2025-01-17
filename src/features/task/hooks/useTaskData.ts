// src/features/task/hooks/useTaskData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import type { Task } from '../types';

export const useTaskData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
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
              completed: data.completed,
              createdAt: data.createdAt
            };
          })
          .filter(task => !task.completed)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        
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

  const addTask = async (title: string) => {
    if (!title.trim() || !user) return;

    setStatus('saving');
    setError(null);

    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: title.trim(),
        completed: false,
        createdAt: serverTimestamp()
      });

      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!user) return;

    setStatus('saving');
    
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !completed,
        updatedAt: serverTimestamp()
      });
      
      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar');
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

  return {
    tasks,
    status,
    error,
    addTask,
    toggleTask,
    deleteTask
  };
};