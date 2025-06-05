import { getLocalDateString } from '@/utils/dates';
import type { Meal } from '../types';

export const MEAL_HOURS: Record<Meal['type'], number> = {
  breakfast: 8,
  morningSnack: 11,
  lunch: 14,
  afternoonSnack: 17,
  dinner: 20
};

export const isPastMeal = (dateStr: string, type: Meal['type']): boolean => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const mealDate = new Date(year, month - 1, day, MEAL_HOURS[type] || 0, 0, 0, 0);
  return mealDate.getTime() < Date.now();
};

export const getWeekDays = (selectedDate: Date = new Date()) => {
  const currentDate = new Date(selectedDate);
  let dayOfWeek = currentDate.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const week = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - dayOfWeek + i);
    week.push({
      dayName: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i],
      fullDate: getLocalDateString(date),
      isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      date: new Date(date) // Agregamos la fecha completa para comparaciones
    });
  }
  
  return week;
};

export const getNextWeek = (currentDate: Date): Date => {
  const nextWeek = new Date(currentDate);
  nextWeek.setDate(nextWeek.getDate() + 7);
  return nextWeek;
};

export const getPreviousWeek = (currentDate: Date): Date => {
  const previousWeek = new Date(currentDate);
  previousWeek.setDate(previousWeek.getDate() - 7);
  return previousWeek;
};

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getMonths = (year: number) => {
  return Array.from({ length: 12 }, (_, i) => ({
    name: new Date(year, i).toLocaleString('es', { month: 'short' }),
    days: getDaysInMonth(year, i),
    number: i + 1
  }));
};

export const isCurrentDate = (date: Date) => {
  return getLocalDateString(date) === getLocalDateString(new Date());
};

export const getCurrentYearMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const formatMonthYear = (date: Date): string => {
  return date.toLocaleString('es', { month: 'long', year: 'numeric' });
};