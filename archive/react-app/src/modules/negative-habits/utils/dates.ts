// src/modules/negative-habits/utils/dates.ts
import { getLocalDateString } from '@/shared/utils/dates';

export interface Month {
  number: number;
  name: string;
  days: number;
}

export interface WeekDay {
  dayName: string;
  fullDate: string;
}

export const getWeekDays = (date: Date): WeekDay[] => {
  const days = [];
  const startDate = new Date(date);
  
  // Ajustar al lunes de la semana
  const currentDay = startDate.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // Si es domingo (0), retroceder 6 días
  startDate.setDate(startDate.getDate() + diff);

  // Generar los 7 días comenzando desde el lunes
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    days.push({
      dayName: currentDate.toLocaleDateString('es-ES', { weekday: 'short' }),
      fullDate: getLocalDateString(currentDate)
    });
  }

  return days;
};

export const getMonths = (year: number): Month[] => {
  const months = [];
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  for (let month = 0; month < 12; month++) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    months.push({
      number: month + 1,
      name: monthNames[month],
      days: lastDay
    });
  }

  return months;
};

/**
 * Obtiene el año y mes en formato YYYY-MM para una fecha dada
 * @param date - Fecha a procesar
 * @returns string en formato YYYY-MM
 */
export const getYearMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Obtiene un array con los meses visibles para la vista anual
 * Devuelve los meses desde el inicio del año hasta el mes actual
 * @param date - Fecha de referencia
 * @returns Array de strings en formato YYYY-MM
 */
export const getVisibleMonths = (date: Date): string[] => {
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;
  const months: string[] = [];

  for (let month = 1; month <= currentMonth; month++) {
    const monthStr = String(month).padStart(2, '0');
    months.push(`${currentYear}-${monthStr}`);
  }

  return months;
};

/**
 * Obtiene la fecha del primer día del mes
 * @param yearMonth - String en formato YYYY-MM
 * @returns Date
 */
export const getMonthStart = (yearMonth: string): Date => {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

/**
 * Obtiene la fecha del último día del mes
 * @param yearMonth - String en formato YYYY-MM
 * @returns Date
 */
export const getMonthEnd = (yearMonth: string): Date => {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0);
};