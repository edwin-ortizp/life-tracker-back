// src/features/negative-habits/utils/firebase.ts
import { db } from '@/firebase';
import { NegativeHabitLog } from '../types';
import { 
  doc, 
  setDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

export interface MonthlyHabits {
  userId: string;
  yearMonth: string;
  habits: {
    [date: string]: {
      [habitId: number]: NegativeHabitLog
    }
  };
  updatedAt: any;
}

export const getMonthDocRef = (userId: string, yearMonth: string) => 
  doc(db, 'negative-habits', `${userId}_${yearMonth}`);

export const logHabitToFirebase = async (
  userId: string,
  yearMonth: string,
  date: string,
  habitId: number,
  currentMonthHabits: MonthlyHabits['habits'],
  note?: string
) => {
  // Create the habit log object, ensuring note is null if undefined
  const newHabit: NegativeHabitLog = {
    habitId,
    timestamp: new Date().getTime(),
    ...(note ? { note } : {}) // Only include note field if it has a value
  };

  // Get current day habits or initialize empty object
  const currentDayHabits = currentMonthHabits[date] || {};
  
  // Create new day habits object
  const newDayHabits = {
    ...currentDayHabits,
    [habitId]: newHabit
  };

  // Create the complete document data
  const docData = {
    userId,
    yearMonth,
    habits: {
      ...currentMonthHabits,
      [date]: newDayHabits
    },
    updatedAt: serverTimestamp()
  };

  // Set the document with merge option
  const docRef = getMonthDocRef(userId, yearMonth);
  await setDoc(docRef, docData, { merge: true });
};

export const removeHabitFromFirebase = async (
  userId: string,
  yearMonth: string,
  date: string,
  habitId: number,
  currentMonthHabits: MonthlyHabits['habits']
) => {
  // Create a copy of current day habits and remove the specific habit
  const currentDayHabits = {...(currentMonthHabits[date] || {})};
  delete currentDayHabits[habitId];

  // Create the complete document data
  const docData = {
    userId,
    yearMonth,
    habits: {
      ...currentMonthHabits,
      [date]: currentDayHabits
    },
    updatedAt: serverTimestamp()
  };

  // Set the document with merge option
  const docRef = getMonthDocRef(userId, yearMonth);
  await setDoc(docRef, docData, { merge: true });
};

export const fetchVisibleMonths = async (
  userId: string,
  months: string[]
) => {
  const habits: Record<string, MonthlyHabits['habits']> = {};
  const habitsCollectionRef = collection(db, 'negative-habits');
  
  for (const yearMonth of months) {
    try {
      const querySnapshot = await getDocs(
        query(
          habitsCollectionRef, 
          where('userId', '==', userId),
          where('yearMonth', '==', yearMonth)
        )
      );

      querySnapshot.forEach((doc) => {
        const data = doc.data() as MonthlyHabits;
        habits[yearMonth] = data.habits || {};
      });
    } catch (error) {
      console.error(`Error fetching month ${yearMonth}:`, error);
    }
  }
  
  return habits;
};