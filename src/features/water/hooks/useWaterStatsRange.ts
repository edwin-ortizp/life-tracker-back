// src/features/water/hooks/useWaterStatsRange.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';
import { DRINKS } from '../types';
import { sumBy, groupBy } from 'lodash';

export interface RangeStats {
  dailyStats: Array<{
    date: string;
    intake: number;
  }>;
  summary: {
    totalIntake: number;
    avgDailyIntake: number;
    daysTracked: number;
    daysWithGoal: number;
  };
  drinkStats: Array<{
    type: keyof typeof DRINKS;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  categoryStats: Array<{
    category: string;
    totalAmount: number;
    percentage: number;
  }>;
  monthlyAverages?: Array<{
    month: string;
    average: number;
  }>;
}

export const useWaterStatsRange = (startDate: Date, endDate: Date) => {
  const [stats, setStats] = useState<RangeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRangeStats = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Generar array de fechas para el rango
        const dates: string[] = [];
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        while (currentDate <= lastDate) {
          dates.push(getLocalDateString(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Inicializar map con todas las fechas
        const rangeData = new Map(dates.map(date => [
          date,
          {
            date,
            drinks: [],
            totalWater: 0
          }
        ]));

        // Obtener documentos usando los IDs construidos
        const docsPromises = dates.map(date => {
          const docRef = doc(db, 'water', `${user.uid}_${date}`);
          return getDoc(docRef);
        });

        const docSnapshots = await Promise.all(docsPromises);

        // Procesar documentos existentes
        docSnapshots.forEach(docSnapshot => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            rangeData.set(data.date, {
              date: data.date,
              drinks: data.drinks || [],
              totalWater: data.totalWater || 0
            });
          }
        });

        const dailyData = Array.from(rangeData.values());

        // Calcular estadísticas
        const totalIntake = sumBy(dailyData, 'totalWater');
        const daysTracked = dailyData.filter(day => day.totalWater > 0).length;
        const daysWithGoal = dailyData.filter(day => day.totalWater >= 2000).length;
        const avgDailyIntake = daysTracked > 0 ? totalIntake / daysTracked : 0;

        // Agrupar todas las bebidas
        const allDrinks = dailyData.flatMap(day => day.drinks);
        const drinksByType = groupBy(allDrinks, 'type');
        
        const drinkStats = Object.entries(drinksByType).map(([type, drinks]) => ({
          type: type as keyof typeof DRINKS,
          count: drinks.length,
          totalAmount: sumBy(drinks, 'amount'),
          percentage: (sumBy(drinks, 'amount') / totalIntake) * 100 || 0
        })).sort((a, b) => b.totalAmount - a.totalAmount);

        // Estadísticas por categoría
        const drinksByCategory = groupBy(allDrinks, (drink: { type: keyof typeof DRINKS }) => 
          DRINKS[drink.type].category
        );

        const categoryStats = Object.entries(drinksByCategory).map(([category, drinks]) => ({
          category,
          totalAmount: sumBy(drinks, 'amount'),
          percentage: (sumBy(drinks, 'amount') / totalIntake) * 100 || 0
        })).sort((a, b) => b.totalAmount - a.totalAmount);

        // Promedios mensuales si el rango es mayor a un mes
        let monthlyAverages;
        if (endDate.getTime() - startDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
          monthlyAverages = Object.entries(groupBy(dailyData, day => day.date.substring(0, 7)))
            .map(([month, days]) => ({
              // Usamos el primer día del mes para tener una fecha válida
              month: `${month}-01`,
              average: sumBy(days, 'totalWater') / days.length
            }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        }

        const dailyStats = dailyData.map(day => ({
          date: day.date,
          intake: day.totalWater
        }));

        setStats({
          dailyStats,
          summary: {
            totalIntake,
            avgDailyIntake,
            daysTracked,
            daysWithGoal
          },
          drinkStats,
          categoryStats,
          ...(monthlyAverages && { monthlyAverages })
        });

      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchRangeStats();
  }, [user, startDate, endDate]);

  return { stats, loading, error };
};