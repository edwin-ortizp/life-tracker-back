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
import type { Recipe } from '../types';

export const useRecipes = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      return;
    }

    setStatus('loading');

    const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Recipe[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name,
            ingredients: data.ingredients || [],
            instructions: data.instructions || '',
            nutrition: data.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
            mealType: data.mealType
          } as Recipe;
        });
        setRecipes(list);
        setStatus('idle');
      },
      err => {
        setError(err instanceof Error ? err.message : 'Error al cargar');
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      await addDoc(collection(db, 'recipes'), {
        ...recipe,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const updateRecipe = async (id: string, data: Partial<Recipe>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      const docRef = doc(db, 'recipes', id);
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    try {
      await deleteDoc(doc(db, 'recipes', id));
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  return { recipes, status, error, addRecipe, updateRecipe, deleteRecipe };
};
