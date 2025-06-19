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
          const recipe: Recipe = {
            id: docSnap.id,
            name: data.name,
            ingredients: data.ingredients || [],
            instructions: data.instructions || '',
            nutrition: data.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
            mealType: data.mealType,
            ...(data.description && { description: data.description }),
            ...(data.difficulty && { difficulty: data.difficulty }),
            ...(data.prepTime !== undefined && { prepTime: data.prepTime }),
            ...(data.favorite !== undefined && { favorite: data.favorite })
          };
          return recipe;
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
      const docData: any = {
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        nutrition: recipe.nutrition,
        mealType: recipe.mealType,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (recipe.description) {
        docData.description = recipe.description;
      }
      if (recipe.difficulty) {
        docData.difficulty = recipe.difficulty;
      }
      if (recipe.prepTime !== undefined) {
        docData.prepTime = recipe.prepTime;
      }
      if (recipe.favorite !== undefined) {
        docData.favorite = recipe.favorite;
      }
      await addDoc(collection(db, 'recipes'), docData);
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
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.ingredients !== undefined) updateData.ingredients = data.ingredients;
      if (data.instructions !== undefined) updateData.instructions = data.instructions;
      if (data.nutrition !== undefined) updateData.nutrition = data.nutrition;
      if (data.mealType !== undefined) updateData.mealType = data.mealType;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
      if (data.prepTime !== undefined) updateData.prepTime = data.prepTime;
      if (data.favorite !== undefined) updateData.favorite = data.favorite;
      await updateDoc(docRef, updateData);
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
