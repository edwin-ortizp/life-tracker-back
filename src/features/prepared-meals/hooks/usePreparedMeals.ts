import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import type { PreparedMeal } from '../types';

export const usePreparedMeals = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<PreparedMeal[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMeals([]);
      return;
    }

    setStatus('loading');

    const q = query(collection(db, 'preparedMeals'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: PreparedMeal[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const meal: PreparedMeal = {
            id: docSnap.id,
            name: data.name || ''
          };
          if (data.portions !== undefined) meal.portions = data.portions;
          return meal;
        });
        setMeals(list);
        setStatus('idle');
      },
      err => {
        setError(err instanceof Error ? err.message : 'Error al cargar');
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addMeal = async (meal: Omit<PreparedMeal, 'id'>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const docData: any = {
        name: meal.name,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (meal.portions !== undefined) {
        docData.portions = meal.portions;
      }
      await addDoc(collection(db, 'preparedMeals'), docData);
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al guardar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const updateMeal = async (id: string, data: Partial<PreparedMeal>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const docRef = doc(db, 'preparedMeals', id);
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.portions !== undefined) updateData.portions = data.portions;
      await updateDoc(docRef, updateData);
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al actualizar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const deleteMeal = async (id: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      await deleteDoc(doc(db, 'preparedMeals', id));
      setStatus('idle');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al eliminar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  return { meals, status, error, addMeal, updateMeal, deleteMeal };
};
