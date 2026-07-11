// src/modules/habit/utils/dateUtils.ts
import { getLocalDateString } from '@/shared/utils/dates';

export const getWeekDays = (selectedDate: Date = new Date()) => {
  const currentDate = new Date(selectedDate);
  let dayOfWeek = currentDate.getDay(); // 0 (domingo) a 6 (sábado)
  
  // Convertir el domingo (0) a 7 y restar 1 para que lunes sea 0
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const week = [];
  
  // Comenzar desde el lunes (restando los días necesarios)
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - dayOfWeek + i);
    week.push({
      dayName: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i],
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