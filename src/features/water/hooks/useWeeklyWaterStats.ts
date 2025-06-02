import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';
import { DRINKS } from '../types';
import { sumBy, groupBy } from 'lodash';

export interface WeeklyStats {
  totalIntake: number;
  avgDailyIntake: number;
  commonDrinks: Array<{
    type: keyof typeof DRINKS;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  dailyIntake: Array<{
    date: string;
    intake: number;
  }>;
  categoryStats: Array<{
    category: string;
    totalAmount: number;
    percentage: number;
  }>;
}

export const useWeeklyWaterStats = (selectedDate: Date) => {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Generar array de fechas para la semana
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(selectedDate);
          date.setDate(date.getDate() - i);
          dates.push(getLocalDateString(date));
        }

        // Obtener documentos individuales
        const weekData = await Promise.all(
          dates.map(async (date) => {
            const docRef = doc(db, 'water', `${user.uid}_${date}`);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              return {
                date,
                drinks: docSnap.data().drinks || [],
                totalWater: docSnap.data().totalWater || 0
              };
            }
            
            return {
              date,
              drinks: [],
              totalWater: 0
            };
          })
        );

        // Calcular estadísticas
        const totalIntake = sumBy(weekData, 'totalWater');
        const avgDailyIntake = totalIntake / 7;

        // Agrupar bebidas por tipo
        const allDrinks = weekData.flatMap(day => day.drinks);
        const drinksByType = groupBy(allDrinks, 'type');
        
        const commonDrinks = Object.entries(drinksByType).map(([type, drinks]) => ({
          type: type as keyof typeof DRINKS,
          count: drinks.length,
          totalAmount: sumBy(drinks, 'amount'),
          percentage: (sumBy(drinks, 'amount') / totalIntake) * 100 || 0
        })).sort((a, b) => b.count - a.count);

        // Estadísticas por categoría
        const drinksByCategory = groupBy(allDrinks, drink => 
          DRINKS[drink.type as keyof typeof DRINKS].category
        );

        const categoryStats = Object.entries(drinksByCategory).map(([category, drinks]) => ({
          category,
          totalAmount: sumBy(drinks, 'amount'),
          percentage: (sumBy(drinks, 'amount') / totalIntake) * 100 || 0
        })).sort((a, b) => b.totalAmount - a.totalAmount);

        // Intake diario
        const dailyIntake = weekData.map(day => ({
          date: day.date,
          intake: day.totalWater
        }));

        setStats({
          totalIntake,
          avgDailyIntake,
          commonDrinks,
          dailyIntake,
          categoryStats
        });

      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, [user, selectedDate]);

  return { stats, loading, error };
};