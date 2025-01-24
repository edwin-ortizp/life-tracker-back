// src/features/exercise/hooks/useExerciseStats.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { ExerciseLog } from '../types';
import { 
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';

export const useExerciseStats = (timeRange: 'week' | 'month' | 'year') => {
  const [statsLogs, setStatsLogs] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchStatsLogs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const now = new Date();
        let startDate = new Date();

        // Calcular fecha de inicio según el rango
        switch (timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        const exercisesRef = collection(db, 'exercises');
        const q = query(
          exercisesRef,
          where('userId', '==', user.uid),
          where('date', '>=', getLocalDateString(startDate)),
          where('date', '<=', getLocalDateString(now)),
          orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const logs: ExerciseLog[] = [];
        
        querySnapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as ExerciseLog);
        });

        setStatsLogs(logs);
        setIsLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error al cargar estadísticas');
        setIsLoading(false);
      }
    };

    fetchStatsLogs();
  }, [user, timeRange]);

  return {
    statsLogs,
    isLoading,
    error
  };
};