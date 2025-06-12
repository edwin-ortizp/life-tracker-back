import { useEffect, useState } from 'react';
import { addDays } from 'date-fns';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
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

    const startStr = getLocalDateString(startDate);
    const endStr = getLocalDateString(addDays(startDate, 6));

    const colRef = collection(db, 'users', user.uid, 'daily-stats');
    const q = query(
      colRef,
      where('date', '>=', startStr),
      where('date', '<=', endStr),
      orderBy('date', 'asc')
    );

    setLoading(true);
    const unsubscribe = onSnapshot(q, async snap => {
      const map: Record<string, DailyStats> = {};
      snap.forEach(doc => {
        map[doc.data().date] = doc.data() as DailyStats;
      });

      const days: { date: string; summary: DailyStats }[] = [];
      const totals: DailyStats = { ...emptyDay, userId: user.uid, date: '' };

      for (let i = 0; i < 7; i++) {
        const d = addDays(startDate, i);
        const dateStr = getLocalDateString(d);
        let dayStats = map[dateStr];
        if (!dayStats) {
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
    });

    return () => unsubscribe();
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
