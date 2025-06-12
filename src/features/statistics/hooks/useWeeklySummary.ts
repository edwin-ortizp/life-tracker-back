import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { fetchDailySummary, DailySummaryData } from './useDailySummary';

export interface WeeklySummaryData {
  daily: { date: string; summary: DailySummaryData }[];
  totals: DailySummaryData;
}

const emptySummary: DailySummaryData = {
  journalWords: 0,
  moodCount: 0,
  habitsCompleted: 0,
  negativeHabitCount: 0,
  exerciseMinutes: 0,
  tasksCompleted: 0,
  pomodoroCount: 0,
  waterIntake: 0
};

export const useWeeklySummary = (startDate: Date) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WeeklySummaryData>({
    daily: [],
    totals: { ...emptySummary }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const daily: { date: string; summary: DailySummaryData }[] = [];
      const totals = { ...emptySummary };
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const sum = await fetchDailySummary(user.uid, d);
        daily.push({ date: getLocalDateString(d), summary: sum });
        (Object.keys(totals) as (keyof DailySummaryData)[]).forEach(key => {
          totals[key] += sum[key];
        });
      }
      setSummary({ daily, totals });
    };
    setLoading(true);
    fetch()
      .catch(() => setSummary({ daily: [], totals: { ...emptySummary } }))
      .finally(() => setLoading(false));
  }, [user, startDate]);

  return { summary, loading };
};
