import { useEffect, useMemo, useState } from 'react';
import { ExerciseService } from '@/modules/exercise/services';
import { useAuth } from '@/shared/hooks/useAuth';
import { useModuleSettings } from '@/shared/hooks/useModuleSettings';
import { getLocalDateString } from '@/shared/utils/dates';

export interface DailyExerciseAggregate {
  date: string;
  calories: number;
  minutes: number;
  entries: number;
  goal: number;
  percent: number;
  met: boolean;
}

interface UseExerciseMonthlyProgressResult {
  dailyStats: DailyExerciseAggregate[];
  dailyStatsMap: Map<string, DailyExerciseAggregate>;
  loading: boolean;
  goal: number;
}

const getMonthRange = (month: Date): { start: Date; end: Date } => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const useExerciseMonthlyProgress = (visibleMonth: Date): UseExerciseMonthlyProgressResult => {
  const { user } = useAuth();
  const { settings } = useModuleSettings('exercise', { dailyCalories: 500 });
  const [dailyStats, setDailyStats] = useState<DailyExerciseAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  const goal = Number(settings.dailyCalories) > 0 ? Number(settings.dailyCalories) : 0;

  useEffect(() => {
    if (!user) {
      return;
    }

    const { start, end } = getMonthRange(visibleMonth);
    const startDate = getLocalDateString(start);
    const endDate = getLocalDateString(end);

    let isCancelled = false;

    const loadMonthlyStats = async () => {
      setLoading(true);

      const { data, error } = await ExerciseService.getExerciseLogsRange(user.id, startDate, endDate);

      if (isCancelled) {
        return;
      }

      if (error) {
        console.error('Error loading monthly exercise progress:', error);
        setDailyStats([]);
        setLoading(false);
        return;
      }

      const statsByDate = new Map<string, DailyExerciseAggregate>();

      data?.forEach((row) => {
        const date = row.date;
        const current = statsByDate.get(date) ?? {
          date,
          calories: 0,
          minutes: 0,
          entries: 0,
          goal,
          percent: 0,
          met: false
        };

        current.calories += row.calories ?? 0;
        current.minutes += row.duration ?? 0;
        current.entries += 1;

        statsByDate.set(date, current);
      });

      const aggregates = Array.from(statsByDate.values())
        .map((day) => {
          const percent = goal > 0 ? (day.calories / goal) * 100 : 0;
          return {
            ...day,
            goal,
            percent,
            met: percent >= 100
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyStats(aggregates);
      setLoading(false);
    };

    loadMonthlyStats();

    return () => {
      isCancelled = true;
    };
  }, [goal, user, visibleMonth]);

  const resolvedDailyStats = useMemo(
    () => (user ? dailyStats : []),
    [dailyStats, user]
  );

  const dailyStatsMap = useMemo(
    () => new Map(resolvedDailyStats.map((day) => [day.date, day])),
    [resolvedDailyStats]
  );

  return {
    dailyStats: resolvedDailyStats,
    dailyStatsMap,
    loading: user ? loading : false,
    goal
  };
};
