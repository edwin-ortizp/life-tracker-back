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
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestoreLogger } from '@/utils/firestore-logger';
import type { PreparedMeal } from '../types';

export const usePreparedMeals = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<PreparedMeal[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Cargar comidas preparadas del usuario (carga inicial única)
  const loadMeals = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      firestoreLogger.logRead('prepared-meals', 'usePreparedMeals.loadMeals');
      const q = query(collection(db, 'prepared-meals'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

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
    } catch (error) {
      console.error('Error loading prepared meals:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar comidas');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setMeals([]);
      return;
    }
    loadMeals();
  }, [user, loadMeals]);

  const addMeal = async (meal: Omit<PreparedMeal, 'id'>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    // Crear comida optimistically
    const optimisticMeal: PreparedMeal = {
      id: `temp-${Date.now()}`,
      ...meal
    };

    // Actualización optimista
    setMeals(prev => [...prev, optimisticMeal]);

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

      firestoreLogger.logWrite('prepared-meals', 'usePreparedMeals.addMeal');
      const docRef = await addDoc(collection(db, 'prepared-meals'), docData);
      
      // Actualizar con el ID real del documento
      setMeals(prev => prev.map(m => 
        m.id === optimisticMeal.id 
          ? { ...m, id: docRef.id }
          : m
      ));

      setStatus('idle');
    } catch (e) {
      console.error('Error adding prepared meal:', e);
      // Revertir actualización optimista en caso de error
      setMeals(prev => prev.filter(m => m.id !== optimisticMeal.id));
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

    // Guardar comida original para revertir si falla
    const originalMeal = meals.find(m => m.id === id);
    if (!originalMeal) return;

    try {
      // Actualización optimista
      const updatedMeal: PreparedMeal = {
        ...originalMeal,
        ...data
      };

      setMeals(prev => prev.map(m => 
        m.id === id ? updatedMeal : m
      ));

      const docRef = doc(db, 'prepared-meals', id);
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.portions !== undefined) updateData.portions = data.portions;

      firestoreLogger.logWrite('prepared-meals', 'usePreparedMeals.updateMeal', id);
      await updateDoc(docRef, updateData);
      setStatus('idle');
    } catch (e) {
      console.error('Error updating prepared meal:', e);
      // Revertir actualización optimista en caso de error
      setMeals(prev => prev.map(m => 
        m.id === id ? originalMeal : m
      ));
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

    // Guardar comida para poder revertir si falla
    const mealToDelete = meals.find(m => m.id === id);
    if (!mealToDelete) return;

    try {
      // Actualización optimista - remover de la lista inmediatamente
      setMeals(prev => prev.filter(m => m.id !== id));

      firestoreLogger.logDelete('prepared-meals', 'usePreparedMeals.deleteMeal', id);
      await deleteDoc(doc(db, 'prepared-meals', id));
      setStatus('idle');
    } catch (e) {
      console.error('Error deleting prepared meal:', e);
      // Revertir actualización optimista en caso de error
      setMeals(prev => [...prev, mealToDelete]);
      const errorMessage = e instanceof Error ? e.message : 'Error al eliminar';
      setError(errorMessage);
      setStatus('error');
    }
  };

  return { meals, status, error, addMeal, updateMeal, deleteMeal, loadMeals };
};
