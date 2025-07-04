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
import type { Recipe } from '../types';

export const useRecipes = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Cargar recetas del usuario (carga inicial única)
  const loadRecipes = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);

    try {
      firestoreLogger.logRead('recipes', 'useRecipes.loadRecipes');
      const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

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
    } catch (error) {
      console.error('Error loading recipes:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar recetas');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      return;
    }
    loadRecipes();
  }, [user, loadRecipes]);

  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setStatus('saving');
    setError(null);

    // Crear receta optimistically
    const optimisticRecipe: Recipe = {
      id: `temp-${Date.now()}`,
      ...recipe
    };

    // Actualización optimista
    setRecipes(prev => [...prev, optimisticRecipe]);

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

      firestoreLogger.logWrite('recipes', 'useRecipes.addRecipe');
      const docRef = await addDoc(collection(db, 'recipes'), docData);
      
      // Actualizar con el ID real del documento
      setRecipes(prev => prev.map(r => 
        r.id === optimisticRecipe.id 
          ? { ...r, id: docRef.id }
          : r
      ));

      setStatus('idle');
    } catch (e) {
      console.error('Error adding recipe:', e);
      // Revertir actualización optimista en caso de error
      setRecipes(prev => prev.filter(r => r.id !== optimisticRecipe.id));
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

    // Guardar receta original para revertir si falla
    const originalRecipe = recipes.find(r => r.id === id);
    if (!originalRecipe) return;

    try {
      // Actualización optimista
      const updatedRecipe: Recipe = {
        ...originalRecipe,
        ...data
      };

      setRecipes(prev => prev.map(r => 
        r.id === id ? updatedRecipe : r
      ));

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

      firestoreLogger.logWrite('recipes', 'useRecipes.updateRecipe', id);
      await updateDoc(docRef, updateData);
      setStatus('idle');
    } catch (e) {
      console.error('Error updating recipe:', e);
      // Revertir actualización optimista en caso de error
      setRecipes(prev => prev.map(r => 
        r.id === id ? originalRecipe : r
      ));
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

    // Guardar receta para poder revertir si falla
    const recipeToDelete = recipes.find(r => r.id === id);
    if (!recipeToDelete) return;

    try {
      // Actualización optimista - remover de la lista inmediatamente
      setRecipes(prev => prev.filter(r => r.id !== id));

      firestoreLogger.logDelete('recipes', 'useRecipes.deleteRecipe', id);
      await deleteDoc(doc(db, 'recipes', id));
      setStatus('idle');
    } catch (e) {
      console.error('Error deleting recipe:', e);
      // Revertir actualización optimista en caso de error
      setRecipes(prev => [...prev, recipeToDelete]);
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  return { recipes, status, error, addRecipe, updateRecipe, deleteRecipe, loadRecipes };
};
