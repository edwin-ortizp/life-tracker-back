import { startOfDay, endOfDay } from 'date-fns';
import { db } from '@/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';
import { DailyStats } from '../types';

export const calculateDailyStats = async (
  uid: string,
  date: Date
): Promise<DailyStats> => {
  const dateStr = getLocalDateString(date);
  const [year, month] = dateStr.split('-');

  const journalSnap = await getDoc(doc(db, 'journal', `${uid}_${dateStr}`));
  const moodSnap = await getDoc(doc(db, 'moods', `${uid}_${dateStr}`));
  const waterSnap = await getDoc(doc(db, 'water', `${uid}_${dateStr}`));
  const exerciseSnap = await getDoc(doc(db, 'exercises', `${uid}_${dateStr}`));
  const pomodoroSnap = await getDoc(doc(db, 'pomodoro', `${uid}_${dateStr}`));
  const habitSnap = await getDoc(doc(db, 'habits', `${uid}_${year}-${month}`));
  const negativeSnap = await getDoc(
    doc(db, 'negative-habits', `${uid}_${year}-${month}`)
  );

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
    userId: uid,
    date: dateStr,
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

export const saveDailyStats = async (
  uid: string,
  date: Date
): Promise<DailyStats> => {
  const stats = await calculateDailyStats(uid, date);
  const docRef = doc(db, 'users', uid, 'daily-stats', stats.date);
  await setDoc(docRef, stats);
  return stats;
};
