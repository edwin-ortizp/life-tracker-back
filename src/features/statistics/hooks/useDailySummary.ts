import { useEffect, useState } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';

export interface DailySummaryData {
  journalWords: number;
  moodCount: number;
  habitsCompleted: number;
  negativeHabitCount: number;
  exerciseMinutes: number;
  tasksCompleted: number;
  pomodoroCount: number;
  waterIntake: number;
}

export const fetchDailySummary = async (uid: string, date: Date): Promise<DailySummaryData> => {
  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');

  const journalSnap = await getDoc(doc(db, 'journal', `${uid}_${dateStr}`));
  const moodSnap = await getDoc(doc(db, 'moods', `${uid}_${dateStr}`));
  const waterSnap = await getDoc(doc(db, 'water', `${uid}_${dateStr}`));
  const exerciseSnap = await getDoc(doc(db, 'exercises', `${uid}_${dateStr}`));
  const pomodoroSnap = await getDoc(doc(db, 'pomodoro', `${uid}_${dateStr}`));
  const habitSnap = await getDoc(doc(db, 'habits', `${uid}_${year}-${month}`));
  const negativeSnap = await getDoc(doc(db, 'negative-habits', `${uid}_${year}-${month}`));

  const start = Timestamp.fromDate(startOfDay(date));
  const end = Timestamp.fromDate(endOfDay(date));
  const taskQuery = query(
    collection(db, 'tasks'),
    where('userId', '==', uid),
    where('completed', '==', true),
    where('updatedAt', '>=', start),
    where('updatedAt', '<=', end)
  );
  const taskDocs = await getDocs(taskQuery);

  return {
    journalWords: journalSnap.exists()
      ? (journalSnap.data().text || '').split(/\s+/).filter(Boolean).length
      : 0,
    moodCount: moodSnap.exists() ? (moodSnap.data().moods || []).length : 0,
    waterIntake: waterSnap.exists() ? waterSnap.data().totalWater || 0 : 0,
    exerciseMinutes: exerciseSnap.exists()
      ? exerciseSnap.data().summary?.totalDuration || 0
      : 0,
    pomodoroCount: pomodoroSnap.exists() ? pomodoroSnap.data().count || 0 : 0,
    habitsCompleted: habitSnap.exists()
      ? Object.entries(habitSnap.data().habits || {}).filter(([key, val]) =>
          key.endsWith(`_${dateStr}`) && val
        ).length
      : 0,
    negativeHabitCount: negativeSnap.exists()
      ? Object.keys(negativeSnap.data().habits?.[dateStr] || {}).length
      : 0,
    tasksCompleted: taskDocs.size
  };
};

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

export const useDailySummary = (date: Date) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DailySummaryData>(emptySummary);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetchDailySummary(user.uid, date);
      setSummary(res);
    } catch {
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, date]);

  return { summary, loading, refetch: fetchData };
};
