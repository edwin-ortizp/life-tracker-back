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
  const [data, setData] = useState<WeeklySummaryData | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const daily: { date: string; summary: DailySummaryData }[] = [];
      const totals = { ...emptySummary };
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const summary = await fetchDailySummary(user.uid, d);
        daily.push({ date: getLocalDateString(d), summary });
        (Object.keys(totals) as (keyof DailySummaryData)[]).forEach(key => {
          totals[key] += summary[key];
        });
      }
      setData({ daily, totals });
    };
    fetch().catch(() => setData(null));
  }, [user, startDate]);

  return data;
};
