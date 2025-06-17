import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';

export interface PomodoroRangeStats {
  dailyStats: Array<{ date: string; minutes: number }>;
}

export const usePomodoroStatsRange = (startDate: Date, endDate: Date) => {
  const [stats, setStats] = useState<PomodoroRangeStats | null>(null);
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
          dates.map(d => getDoc(doc(db, 'pomodoro', `${user.uid}_${d}`)))
        );

        const dailyStats = snapshots.map((snap, idx) => {
          const sessions = snap.exists() ? snap.data().sessions || [] : [];
          const minutes =
            sessions
              .filter((s: any) => s.completed)
              .reduce((acc: number, s: any) => acc + (s.duration || 0), 0) / 60;
          return { date: dates[idx], minutes };
        });

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
