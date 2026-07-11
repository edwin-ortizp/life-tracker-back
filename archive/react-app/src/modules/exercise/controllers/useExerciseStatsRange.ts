import { useState, useEffect } from 'react';
import { ExerciseService } from '@/modules/exercise/services';
import { useAuth } from '@/shared/hooks/useAuth';
import { getLocalDateString } from '@/shared/utils/dates';

interface DayStats {
  date: string;
  calories: number;
  count: number;
}

export function useExerciseStatsRange(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      setLoading(true);

      const start = getLocalDateString(startDate);
      const end = getLocalDateString(endDate);

      const { data, error } = await ExerciseService.getExerciseStatsRange(user.id, start, end);

      if (error) {
        console.error('Error loading exercise stats:', error);
        setLoading(false);
        return;
      }

      // Aggregate by date
      const statsByDate: Record<string, DayStats> = {};

      data?.forEach((exercise) => {
        if (!statsByDate[exercise.date]) {
          statsByDate[exercise.date] = {
            date: exercise.date,
            calories: 0,
            count: 0
          };
        }
        statsByDate[exercise.date].calories += exercise.calories_burned || 0;
        statsByDate[exercise.date].count += 1;
      });

      setStats(Object.values(statsByDate));
      setLoading(false);
    };

    loadStats();
  }, [user, startDate, endDate]);

  return { stats, loading };
}
