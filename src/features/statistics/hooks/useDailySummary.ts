import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { getLocalDateString } from '@/utils/dates';
import { DailyStats } from '../types';
import { saveDailyStats } from '../utils/firebase';

export type DailySummaryData = DailyStats;

const emptySummary: DailySummaryData = {
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

export const useDailySummary = (date: Date) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DailySummaryData>(emptySummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const dateStr = getLocalDateString(date);
    const statsRef = doc(db, 'users', user.uid, 'daily-stats', dateStr);

    setLoading(true);
    const unsubscribe = onSnapshot(statsRef, async snap => {
      if (snap.exists()) {
        setSummary(snap.data() as DailySummaryData);
        setLoading(false);
      } else {
        const data = await saveDailyStats(user.uid, date);
        setSummary(data);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user, date]);

  const refetch = async () => {
    if (!user) return;
    setLoading(true);
    const data = await saveDailyStats(user.uid, date);
    setSummary(data);
    setLoading(false);
  };

  return { summary, loading, refetch };
};
