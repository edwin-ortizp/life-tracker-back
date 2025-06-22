import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';
import { MealPlan, Meal, MealPlanEntry } from '../types';
import { getCurrentYearMonth } from '../utils/dateUtils';

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

  useEffect(() => {
    if (!user) return;

    setStatus('loading');
    const yearMonth = getCurrentYearMonth();
    const currentMonthRef = doc(db, 'meals', `${user.uid}_${yearMonth}`);
    
    const unsubscribe = onSnapshot(currentMonthRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as MonthlyMealPlan;
          setMonthlyMealPlans(prev => ({
            ...prev,
            [yearMonth]: data.meals || {}
          }));

          if (import.meta.env.DEV) {
            console.log('Meal plan snapshot', {
              fromCache: doc.metadata.fromCache,
              pending: doc.metadata.hasPendingWrites
            });
          }

          if (doc.metadata.hasPendingWrites) {
            setStatus('pending');
          } else {
            setStatus('saved');
          }
        } else {
          setMonthlyMealPlans(prev => ({
            ...prev,
            [yearMonth]: {}
          }));
          setStatus('saved');
        }
      },
      (error) => {
        console.error('Error loading meal plan:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar el plan');
        setStatus('error');
      }
    );

    // Fetch other visible months if needed
    const fetchVisibleMonths = async () => {
      const visibleMonths = getVisibleMonths();
      const mealsCollectionRef = collection(db, 'meals');
      
      for (const month of visibleMonths) {
        if (month === yearMonth) continue;
        
        try {
          const q = query(mealsCollectionRef, 
            where('userId', '==', user.uid),
            where('yearMonth', '==', month)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              const data = doc.data() as MonthlyMealPlan;
              setMonthlyMealPlans(prev => ({
                ...prev,
                [month]: data.meals || {}
              }));
            });
          } else {
            setMonthlyMealPlans(prev => ({
              ...prev,
              [month]: {}
            }));
          }
        } catch (error) {
          console.error(`Error fetching month ${month}:`, error);
        }
      }
    };

    fetchVisibleMonths();
    return () => unsubscribe();
  }, [user]);

  const addMeal = async (date: string, type: Meal['type'], meal: Omit<Meal, 'id'>) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;
    const mealId = `${date}_${type}`;
    
    try {
      const currentMonthMeals = monthlyMealPlans[yearMonth] || {};
      const newMealPlan = {
        ...currentMonthMeals,
        [date]: {
          ...currentMonthMeals[date],
          [type]: {
            id: mealId,
            ...meal
          }
        }
      };

      setMonthlyMealPlans(prev => ({
        ...prev,
        [yearMonth]: newMealPlan
      }));
      
      const docRef = doc(db, 'meals', `${user.uid}_${yearMonth}`);
      await setDoc(docRef, {
        userId: user.uid,
        yearMonth,
        meals: newMealPlan,
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (import.meta.env.DEV) {
        console.log('Meal added locally');
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
      throw error;
    }
  };

  const removeMeal = async (date: string, type: Meal['type']) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const [year, month] = date.split('-');
    const yearMonth = `${year}-${month}`;
    
    try {
      // Crear una copia profunda del estado actual
      const currentMonthMeals = JSON.parse(JSON.stringify(monthlyMealPlans[yearMonth] || {}));
      
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
      await setDoc(docRef, {
        userId: user.uid,
        yearMonth,
        meals: currentMonthMeals,
        updatedAt: serverTimestamp()
      });

      if (import.meta.env.DEV) {
        console.log('Meal removed locally');
      }
    } catch (error) {
      console.error('Error removing meal:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
      throw error;
    }
  };

  const importMealPlan = async (newMealPlan: MealPlan) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

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
            type: type as Meal['type']
          };
          return mealAcc;
        }, {} as MealPlanEntry);

        return acc;
      }, {} as Record<string, MealPlan>);

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

      await batch.commit();
      if (import.meta.env.DEV) {
        console.log('Meal plan imported locally');
      }
    } catch (error) {
      console.error('Error importing meal plan:', error);
      setError(error instanceof Error ? error.message : 'Error al importar');
      setStatus('error');
      throw error;
    }
  };

  const resync = useResync('Meal plan');

  return {
    mealPlan,
    status,
    error,
    addMeal,
    removeMeal,
    importMealPlan,
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