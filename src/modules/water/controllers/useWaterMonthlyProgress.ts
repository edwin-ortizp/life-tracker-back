import { useEffect, useMemo, useState } from 'react';
import { WaterService } from '@/modules/water/services/WaterService';
import { useAuth } from '@/shared/hooks/useAuth';
import { useModuleSettings } from '@/shared/hooks/useModuleSettings';
import { getLocalDateString } from '@/shared/utils/dates';

export interface DailyWaterAggregate {
  date: string;
  intakeMl: number;
  entries: number;
  goalMl: number;
  percent: number;
  met: boolean;
}

interface UseWaterMonthlyProgressResult {
  dailyStats: DailyWaterAggregate[];
  dailyStatsMap: Map<string, DailyWaterAggregate>;
  loading: boolean;
  goalMl: number;
}

const getMonthRange = (month: Date): { start: Date; end: Date } => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const useWaterMonthlyProgress = (
  visibleMonth: Date,
  goalOverride?: number
): UseWaterMonthlyProgressResult => {
  const { user } = useAuth();
  const { settings } = useModuleSettings('water', { dailyGoalMl: 2000 });
  const [dailyStats, setDailyStats] = useState<DailyWaterAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  const resolvedGoal = Number(settings.dailyGoalMl) > 0 ? Number(settings.dailyGoalMl) : 0;
  const goalMl = Number(goalOverride) > 0 ? Number(goalOverride) : resolvedGoal;

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

      const { data, error } = await WaterService.getDrinkLogsRange(user.id, startDate, endDate);

      if (isCancelled) {
        return;
      }

      if (error) {
        console.error('Error loading monthly water progress:', error);
        setDailyStats([]);
        setLoading(false);
        return;
      }

      const statsByDate = new Map<string, DailyWaterAggregate>();

      data?.forEach((row) => {
        const date = row.date;
        const current = statsByDate.get(date) ?? {
          date,
          intakeMl: 0,
          entries: 0,
          goalMl,
          percent: 0,
          met: false
        };

        const hydratedAmount = row.hydration_value ?? row.amount ?? 0;
        current.intakeMl += hydratedAmount;
        current.entries += 1;

        statsByDate.set(date, current);
      });

      const aggregates = Array.from(statsByDate.values())
        .map((day) => {
          const percent = goalMl > 0 ? (day.intakeMl / goalMl) * 100 : 0;
          return {
            ...day,
            goalMl,
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
  }, [goalMl, user, visibleMonth]);

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
    goalMl
  };
};
