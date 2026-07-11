import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { getLocalDateString } from '@/shared/utils/dates';
import { StatisticsService } from '@/modules/statistics/services';
import { HABITS } from '@/modules/habit/models';
import type {
  StatsSummary,
  MoodTrendPoint,
  StatisticsDashboardData
} from '@/modules/statistics/models/StatisticsModel';

const emptySummary: StatsSummary = {
  waterMl: 0,
  exerciseCount: 0,
  exerciseCalories: 0,
  moodEntries: 0,
  moodAverage: 0,
  journalEntries: 0,
  habitWeeklyCompletionPct: 0,
  habitWeeklyCompleted: 0,
  habitWeeklyTotal: HABITS.length * 7
};

const daysAgoDateString = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalDateString(date);
};

const dateLabel = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('es-ES', { weekday: 'short' });
};

const getDateRange = (fromDate: string, days: number) => {
  const dates: string[] = [];
  const startDate = new Date(`${fromDate}T00:00:00`);

  for (let index = 0; index < days; index += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    dates.push(getLocalDateString(date));
  }

  return dates;
};

const calculateWeeklyHabitStats = (
  rows: Array<{ completed: boolean | null }>,
  habitsPerDay: number
) => {
  const completed = rows.filter((row) => row.completed).length;
  const total = habitsPerDay * 7;
  const pct = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
  return { completed, total, pct };
};

export const useStatisticsController = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatisticsDashboardData>({
    summary: emptySummary,
    moodTrend: []
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setData({ summary: emptySummary, moodTrend: [] });
      setStatus('ready');
      return;
    }

    const toDate = getLocalDateString(new Date());
    const fromDate = daysAgoDateString(6);

    setStatus('loading');
    setError(null);

    try {
      const [drinkRes, exerciseRes, moodRangeRes, journalRes, habitsRangeRes] = await Promise.all([
        StatisticsService.getDrinkLogsRange(user.id, fromDate, toDate),
        StatisticsService.getExerciseLogsRange(user.id, fromDate, toDate),
        StatisticsService.getMoodEntriesRange(user.id, fromDate, toDate),
        StatisticsService.getJournalEntriesRange(user.id, fromDate, toDate),
        StatisticsService.getHabitCompletionsRange(user.id, fromDate, toDate)
      ]);

      if (drinkRes.error) throw drinkRes.error;
      if (exerciseRes.error) throw exerciseRes.error;
      if (moodRangeRes.error) throw moodRangeRes.error;
      if (journalRes.error) throw journalRes.error;
      if (habitsRangeRes.error) throw habitsRangeRes.error;

      const waterMl = (drinkRes.data || []).reduce((acc, row) => acc + (row.amount || 0), 0);
      const exerciseCount = (exerciseRes.data || []).length;
      const exerciseCalories = (exerciseRes.data || []).reduce(
        (acc, row) => acc + (row.calories || 0),
        0
      );
      const moodEntries = (moodRangeRes.data || []).length;
      const moodAverage = moodEntries
        ? (moodRangeRes.data || []).reduce((acc, row) => acc + (row.value || 0), 0) / moodEntries
        : 0;
      const journalEntries = (journalRes.data || []).length;
      const weeklyHabitStats = calculateWeeklyHabitStats(habitsRangeRes.data || [], HABITS.length);

      const moodByDate: Record<string, { total: number; count: number }> = {};
      (moodRangeRes.data || []).forEach((row) => {
        if (!moodByDate[row.date]) {
          moodByDate[row.date] = { total: 0, count: 0 };
        }
        moodByDate[row.date].total += row.value || 0;
        moodByDate[row.date].count += 1;
      });

      const moodTrend: MoodTrendPoint[] = getDateRange(fromDate, 7).map((date) => ({
        date,
        label: dateLabel(date),
        value: moodByDate[date]
          ? Number((moodByDate[date].total / moodByDate[date].count).toFixed(2))
          : null
      }));

      setData({
        summary: {
          waterMl,
          exerciseCount,
          exerciseCalories,
          moodEntries,
          moodAverage: Number(moodAverage.toFixed(2)),
          journalEntries,
          habitWeeklyCompletionPct: weeklyHabitStats.pct,
          habitWeeklyCompleted: weeklyHabitStats.completed,
          habitWeeklyTotal: weeklyHabitStats.total
        },
        moodTrend
      });
      setStatus('ready');
    } catch (err) {
      console.error('Error loading statistics dashboard:', err);
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard');
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    data,
    status,
    error,
    reload: loadDashboard
  };
};
