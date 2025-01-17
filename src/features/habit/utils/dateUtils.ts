// src/features/habit/utils/dateUtils.ts
import { getLocalDateString } from '@/utils/dates';

export const getWeekDays = (selectedDate: Date = new Date()) => {
  const currentDate = new Date(selectedDate);
  const day = currentDate.getDay();
  const week = [];
  
  // Ajustar para que la semana comience desde el domingo (0)
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - day + i);
    week.push({
      dayName: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][date.getDay()],
      fullDate: getLocalDateString(date)
    });
  }
  
  return week;
};

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getMonths = (year: number) => {
  return Array.from({ length: 12 }, (_, i) => ({
    name: new Date(year, i).toLocaleString('es', { month: 'short' }),
    days: getDaysInMonth(year, i)
  }));
};

export const isCurrentDate = (date: Date) => {
  return getLocalDateString(date) === getLocalDateString(new Date());
};