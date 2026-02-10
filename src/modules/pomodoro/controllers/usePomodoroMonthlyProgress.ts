import { useEffect, useMemo, useState } from 'react';
import { PomodoroService } from '@/modules/pomodoro/services';
import { useAuth } from '@/shared/hooks/useAuth';
import { useModuleSettings } from '@/shared/hooks/useModuleSettings';
import { getLocalDateString } from '@/shared/utils/dates';

export interface DailyPomodoroAggregate {
  date: string;
  workedMinutes: number;
  entries: number;
  goalMinutes: number;
  percent: number;
  met: boolean;
}

interface UsePomodoroMonthlyProgressResult {
  dailyStats: DailyPomodoroAggregate[];
  dailyStatsMap: Map<string, DailyPomodoroAggregate>;
  loading: boolean;
  goalMinutes: number;
}

const getMonthRange = (month: Date): { start: Date; end: Date } => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const usePomodoroMonthlyProgress = (
  visibleMonth: Date,
  goalOverride?: number
): UsePomodoroMonthlyProgressResult => {
  const { user } = useAuth();
  const { settings } = useModuleSettings('pomodoro', { dailyWorkMinutesGoal: 300 });
  const [dailyStats, setDailyStats] = useState<DailyPomodoroAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  const configuredGoal = Number(settings.dailyWorkMinutesGoal) > 0 ? Number(settings.dailyWorkMinutesGoal) : 0;
  const goalMinutes = Number(goalOverride) > 0 ? Number(goalOverride) : configuredGoal;

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

      const { data, error } = await PomodoroService.getSessionsRange(user.id, startDate, endDate);

      if (isCancelled) {
        return;
      }

      if (error) {
        console.error('Error loading monthly pomodoro progress:', error);
        setDailyStats([]);
        setLoading(false);
        return;
      }

      const statsByDate = new Map<string, { workedSeconds: number; entries: number }>();

      data?.forEach((row) => {
        const current = statsByDate.get(row.date) ?? { workedSeconds: 0, entries: 0 };
        current.workedSeconds += row.duration || 0;
        current.entries += 1;
        statsByDate.set(row.date, current);
      });

      const aggregates = Array.from(statsByDate.entries())
        .map(([date, value]) => {
          const workedMinutes = Math.floor(value.workedSeconds / 60);
          const percent = goalMinutes > 0 ? (workedMinutes / goalMinutes) * 100 : 0;

          return {
            date,
            workedMinutes,
            entries: value.entries,
            goalMinutes,
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
  }, [goalMinutes, user, visibleMonth]);

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
    goalMinutes
  };
};
