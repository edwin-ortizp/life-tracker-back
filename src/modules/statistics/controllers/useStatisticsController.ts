import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { getLocalDateString } from '@/shared/utils/dates';
import { StatisticsService } from '@/modules/statistics/services';
import type {
  DailyStatsSummary,
  MoodTrendPoint,
  StatisticsDashboardData
} from '@/modules/statistics/models/StatisticsModel';

const emptySummary: DailyStatsSummary = {
  waterMl: 0,
  exerciseCount: 0,
  exerciseCalories: 0,
  moodEntries: 0,
  moodAverage: 0,
  journalEntries: 0
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

    const today = getLocalDateString(new Date());
    const sevenDaysAgo = daysAgoDateString(6);

    setStatus('loading');
    setError(null);

    try {
      const [drinkRes, exerciseRes, moodTodayRes, moodRangeRes, journalRes] = await Promise.all([
        StatisticsService.getDrinkLogsByDate(user.id, today),
        StatisticsService.getExerciseLogsByDate(user.id, today),
        StatisticsService.getMoodEntriesByDate(user.id, today),
        StatisticsService.getMoodEntriesRange(user.id, sevenDaysAgo, today),
        StatisticsService.getJournalEntriesByDate(user.id, today)
      ]);

      if (drinkRes.error) throw drinkRes.error;
      if (exerciseRes.error) throw exerciseRes.error;
      if (moodTodayRes.error) throw moodTodayRes.error;
      if (moodRangeRes.error) throw moodRangeRes.error;
      if (journalRes.error) throw journalRes.error;

      const waterMl = (drinkRes.data || []).reduce((acc, row) => acc + (row.amount || 0), 0);
      const exerciseCount = (exerciseRes.data || []).length;
      const exerciseCalories = (exerciseRes.data || []).reduce(
        (acc, row) => acc + (row.calories || 0),
        0
      );
      const moodEntries = (moodTodayRes.data || []).length;
      const moodAverage = moodEntries
        ? (moodTodayRes.data || []).reduce((acc, row) => acc + (row.value || 0), 0) / moodEntries
        : 0;
      const journalEntries = (journalRes.data || []).length;

      const moodByDate: Record<string, { total: number; count: number }> = {};
      (moodRangeRes.data || []).forEach((row) => {
        if (!moodByDate[row.date]) {
          moodByDate[row.date] = { total: 0, count: 0 };
        }
        moodByDate[row.date].total += row.value || 0;
        moodByDate[row.date].count += 1;
      });

      const moodTrend: MoodTrendPoint[] = Object.entries(moodByDate).map(([date, values]) => ({
        date,
        label: dateLabel(date),
        value: Number((values.total / values.count).toFixed(2))
      }));

      setData({
        summary: {
          waterMl,
          exerciseCount,
          exerciseCalories,
          moodEntries,
          moodAverage: Number(moodAverage.toFixed(2)),
          journalEntries
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
