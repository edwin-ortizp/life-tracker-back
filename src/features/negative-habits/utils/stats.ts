// src/features/negative-habits/utils/stats.ts
import { NegativeHabitLog } from '../types';

export interface MonthStats {
  totalCount: number;
  byHabitId: Record<number, number>;
  byDate: Record<string, number>;
}

export const getMonthStats = (habits: { [key: string]: NegativeHabitLog }): MonthStats => {
  const stats = {
    totalCount: 0,
    byHabitId: {} as Record<number, number>,
    byDate: {} as Record<string, number>,
  };

  Object.entries(habits).forEach(([key]) => {
    const [habitId, date] = key.split('_');
    const numericHabitId = parseInt(habitId);

    stats.totalCount++;
    stats.byHabitId[numericHabitId] = (stats.byHabitId[numericHabitId] || 0) + 1;
    stats.byDate[date] = (stats.byDate[date] || 0) + 1;
  });

  return stats;
};

export const getTopHabits = (habits: { [key: string]: NegativeHabitLog }, limit: number = 5) => {
  const stats = getMonthStats(habits);
  return Object.entries(stats.byHabitId)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([habitId, count]) => ({
      habitId: parseInt(habitId),
      count
    }));
};

export const getMostFrequentDays = (habits: { [key: string]: NegativeHabitLog }, limit: number = 3) => {
  const stats = getMonthStats(habits);
  return Object.entries(stats.byDate)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([date, count]) => ({
      date,
      count
    }));
};