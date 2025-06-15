import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';

export interface ExerciseRangeStats {
  dailyStats: Array<{ date: string; calories: number }>;
}

export const useExerciseStatsRange = (startDate: Date, endDate: Date) => {
  const [stats, setStats] = useState<ExerciseRangeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      setStats(null);
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const dates: string[] = [];
        const cur = new Date(startDate);
        while (cur <= endDate) {
          dates.push(getLocalDateString(cur));
          cur.setDate(cur.getDate() + 1);
        }

        const snapshots = await Promise.all(
          dates.map((d) => getDoc(doc(db, 'exercises', `${user.uid}_${d}`)))
        );

        const dailyStats = snapshots.map((snap, idx) => ({
          date: dates[idx],
          calories: snap.exists() ? snap.data().summary?.totalCalories || 0 : 0,
        }));

        setStats({ dailyStats });
      } catch (e) {
        console.error('Error al cargar estadísticas:', e);
        setError(e instanceof Error ? e.message : 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, startDate, endDate]);

  return { stats, loading, error };
};
