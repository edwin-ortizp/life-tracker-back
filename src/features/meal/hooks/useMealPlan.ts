import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { firestoreLogger } from '@/utils/firestore-logger';
import { useResync } from '@/hooks/useResync';
import { MealPlan, Meal, MealPlanEntry } from '../types';
import { getCurrentYearMonth } from '@/utils/dates';

interface MonthlyMealPlan {
  userId: string;
  yearMonth: string;
  meals: MealPlan;
  updatedAt: any;
}

type MealPlanStatus = 'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error';

export const useMealPlan = () => {
  const [monthlyMealPlans, setMonthlyMealPlans] = useState<Record<string, MealPlan>>({});
  const [status, setStatus] = useState<MealPlanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Combine all monthly meal plans into a single object for the UI
  const mealPlan: MealPlan = Object.values(monthlyMealPlans).reduce((acc, monthPlan) => ({
    ...acc,
    ...monthPlan
  }), {});

  // Cargar planes de comida (carga inicial única)
  const loadMealPlans = useCallback(async () => {
    if (!user) return;

    setStatus('loading');
    setError(null);
    const yearMonth = getCurrentYearMonth();

    try {
      let newMonthlyMealPlans: Record<string, MealPlan> = {};

      // Cargar mes actual
      firestoreLogger.logRead('meals', 'useMealPlan.loadCurrentMonth');
      const currentMonthRef = doc(db, 'meals', `${user.uid}_${yearMonth}`);
      const currentMonthDoc = await getDoc(currentMonthRef);
      
      if (currentMonthDoc.exists()) {
        const data = currentMonthDoc.data() as MonthlyMealPlan;
        newMonthlyMealPlans[yearMonth] = data.meals || {};
      } else {
        newMonthlyMealPlans[yearMonth] = {};
      }

      // Cargar otros meses visibles
      const visibleMonths = getVisibleMonths();
      const mealsCollectionRef = collection(db, 'meals');
      
      for (const month of visibleMonths) {
        if (month === yearMonth) continue;
        
        try {
          firestoreLogger.logRead('meals', `useMealPlan.loadMonth_${month}`);
          const q = query(mealsCollectionRef, 
            where('userId', '==', user.uid),
            where('yearMonth', '==', month)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              const data = doc.data() as MonthlyMealPlan;
              newMonthlyMealPlans[month] = data.meals || {};
            });
          } else {
            newMonthlyMealPlans[month] = {};
          }
        } catch (error) {
          console.error(`Error fetching month ${month}:`, error);
        }
      }

      setMonthlyMealPlans(newMonthlyMealPlans);
      setStatus('saved');
      
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      console.error('Error loading meal plans:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar el plan');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    loadMealPlans();
  }, [loadMealPlans]);

  const addMeal = useCallback(async (date: string, type: Meal['type'], meal: Omit<Meal, 'id'>) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;
    const mealId = `${date}_${type}`;
    
    // Guardar estado original para revertir si falla
    const originalMonthPlan = monthlyMealPlans[yearMonth] || {};

    try {
      // Actualización optimista
      const newMealPlan = {
        ...originalMonthPlan,
        [date]: {
          ...originalMonthPlan[date],
          [type]: {
            id: mealId,
            ...meal,
            calories: meal.calories
          }
        }
      };

      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: newMealPlan
      }));
      
      const docRef = doc(db, 'meals', `${user.uid}_${yearMonth}`);
      firestoreLogger.logWrite('meals', 'useMealPlan.addMeal');
      await setDoc(docRef, {
        userId: user.uid,
        yearMonth,
        meals: newMealPlan,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      // Revertir actualización optimista en caso de error
      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: originalMonthPlan
      }));
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
      throw error;
    }
  }, [user, monthlyMealPlans]);

  const removeMeal = useCallback(async (date: string, type: Meal['type']) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;
    
    // Guardar estado original para revertir si falla
    const originalMonthPlan = monthlyMealPlans[yearMonth] || {};

    try {
      // Actualización optimista
      const currentMonthMeals = JSON.parse(JSON.stringify(originalMonthPlan));
      
      if (currentMonthMeals[date]) {
        // Eliminar la comida específica
        const updatedDayMeals = { ...currentMonthMeals[date] };
        delete updatedDayMeals[type];
        
        // Si no quedan comidas para ese día, eliminar el día completo
        if (Object.keys(updatedDayMeals).length === 0) {
          delete currentMonthMeals[date];
        } else {
          currentMonthMeals[date] = updatedDayMeals;
        }
      }

      // Actualizar estado local
      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: currentMonthMeals
      }));
      
      // Actualizar Firestore
      const docRef = doc(db, 'meals', `${user.uid}_${yearMonth}`);
      firestoreLogger.logWrite('meals', 'useMealPlan.removeMeal');
      await setDoc(docRef, {
        userId: user.uid,
        yearMonth,
        meals: currentMonthMeals,
        updatedAt: serverTimestamp()
      });

      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      console.error('Error removing meal:', error);
      // Revertir actualización optimista en caso de error
      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: originalMonthPlan
      }));
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
      throw error;
    }
  }, [user, monthlyMealPlans]);

  const importMealPlan = useCallback(async (newMealPlan: MealPlan) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    // Guardar estado original para revertir si falla
    const originalMonthlyMealPlans = monthlyMealPlans;

    try {
      const mealsByMonth = Object.entries(newMealPlan).reduce((acc, [date, meals]) => {
        const [year, month] = date.split('-');
        const yearMonth = `${year}-${month}`;
        
        if (!acc[yearMonth]) {
          acc[yearMonth] = {};
        }
        
        acc[yearMonth][date] = Object.entries(meals).reduce((mealAcc, [type, meal]) => {
          const mealId = `${date}_${type}`;
          mealAcc[type] = {
            ...meal,
            id: mealId,
            type: type as Meal['type'],
            calories: meal.calories
          };
          return mealAcc;
        }, {} as MealPlanEntry);

        return acc;
      }, {} as Record<string, MealPlan>);

      // Actualización optimista
      setMonthlyMealPlans(prev => ({
        ...prev,
        ...mealsByMonth
      }));

      const batch = writeBatch(db);
      
      Object.entries(mealsByMonth).forEach(([yearMonth, meals]) => {
        const docRef = doc(db, 'meals', `${user.uid}_${yearMonth}`);
        batch.set(docRef, {
          userId: user.uid,
          yearMonth,
          meals,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });

      firestoreLogger.logWrite('meals', 'useMealPlan.importMealPlan');
      await batch.commit();
      
      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      console.error('Error importing meal plan:', error);
      // Revertir actualización optimista en caso de error
      setMonthlyMealPlans(originalMonthlyMealPlans);
      setError(error instanceof Error ? error.message : 'Error al importar');
      setStatus('error');
      throw error;
    }
  }, [user, monthlyMealPlans]);

  const resync = useResync('Meal plan');

  return {
    mealPlan,
    status,
    error,
    addMeal,
    removeMeal,
    importMealPlan,
    loadMealPlans,
    resync
  };
};

// Función auxiliar para obtener los meses visibles
const getVisibleMonths = (): string[] => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const dayOfMonth = currentDate.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const currentMonthStr = String(month).padStart(2, '0');
  const visibleMonths = [`${year}-${currentMonthStr}`];

  if (daysInMonth - dayOfMonth < 7) {
    let nextMonth = month + 1;
    let nextMonthYear = year;
    
    if (nextMonth > 12) {
      nextMonth = 1;
      nextMonthYear = year + 1;
    }
    
    const nextMonthStr = String(nextMonth).padStart(2, '0');
    visibleMonths.push(`${nextMonthYear}-${nextMonthStr}`);
  }
  
  return visibleMonths;
};