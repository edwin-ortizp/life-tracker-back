import { useEffect, useState } from 'react';
import { addDays } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { getLocalDateString } from '@/utils/dates';
import { DailyStats } from '../types';
import { saveDailyStats } from '../utils/firebase';

export interface WeeklySummaryData {
  daily: { date: string; summary: DailyStats }[];
  totals: DailyStats;
}

const emptyDay: DailyStats = {
  userId: '',
  date: '',
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
  const [summary, setSummary] = useState<WeeklySummaryData>({ daily: [], totals: { ...emptyDay } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const days: { date: string; summary: DailyStats }[] = [];
      const totals: DailyStats = { ...emptyDay, userId: user.uid, date: '' };

      for (let i = 0; i < 7; i++) {
        const d = addDays(startDate, i);
        const dateStr = getLocalDateString(d);
        const docRef = doc(db, 'daily-stats', `${user.uid}_${dateStr}`);
        const snap = await getDoc(docRef);
        let dayStats: DailyStats;
        if (snap.exists()) {
          dayStats = snap.data() as DailyStats;
        } else {
          dayStats = await saveDailyStats(user.uid, d);
        }
        days.push({ date: dateStr, summary: dayStats });
        (Object.keys(totals) as (keyof DailyStats)[]).forEach(key => {
          if (key === 'userId' || key === 'date') return;
          totals[key] += dayStats[key];
        });
      }

      setSummary({ daily: days, totals });
      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startDate]);

  const refetch = async () => {
    if (!user) return;
    setLoading(true);
    for (let i = 0; i < 7; i++) {
      await saveDailyStats(user.uid, addDays(startDate, i));
    }
    setLoading(false);
  };

  return { summary, loading, refetch };
};
