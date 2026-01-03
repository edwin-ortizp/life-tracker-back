// src/utils/dates.ts
import { 
  format, 
  addDays, 
  addWeeks, 
  addMonths, 
  startOfDay,
  endOfDay,
  isWithinInterval
} from 'date-fns';
import { es } from 'date-fns/locale';

// Obtiene la fecha local en formato YYYY-MM-DD considerando la zona horaria del usuario
export const getLocalDateString = (date: Date = new Date()): string => {
  const localDate = new Date(date.getTime());
  localDate.setHours(0, 0, 0, 0);
  return localDate.toISOString().split('T')[0];
};

// Función auxiliar para verificar si dos timestamps están en el mismo día local
export const areSameLocalDay = (timestamp1: number, timestamp2: number): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return getLocalDateString(date1) === getLocalDateString(date2);
};

// Normaliza una fecha para establecerla al mediodía local
export const toNoon = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
};

// Formato de fecha completo en español con UTC
export const formatDateToSpanishWithUTC = (date: Date): string => {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12;
  hours = hours ? hours : 12;

  const offset = -date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const sign = offset >= 0 ? '+' : '-';

  return `${day} de ${month} de ${year}, ${hours}:${minutes}:${seconds} ${ampm} UTC${sign}${offsetHours}`;
};

// Crear timestamp formateado con offset
export const createFormattedTimestamp = (baseDate: Date, hours: number, minutes: number) => {
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  
  return {
    timestamp: date.getTime(),
    utcOffset: -date.getTimezoneOffset(),
    formatted: formatDateToSpanishWithUTC(date)
  };
};

// Funciones para manejo de recurrencia
export const calculateNextRecurrenceDate = (
  baseDate: Date = new Date(),
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom' = 'daily',
  customDays: number = 1
): Date => {
  const startDate = startOfDay(baseDate);
  
  switch (pattern) {
    case 'daily':
      return addDays(startDate, 1);
    case 'weekly':
      return addWeeks(startDate, 1);
    case 'monthly':
      return addMonths(startDate, 1);
    case 'custom':
      return addDays(startDate, customDays);
    default:
      return startDate;
  }
};

// Obtener texto de recurrencia
export const getRecurrenceText = (nextDate: Date, pattern: string, customDays?: number): string => {
  const dateText = format(nextDate, "'próximo' EEEE", { locale: es });
  
  switch (pattern) {
    case 'daily':
      return `Diariamente (${dateText})`;
    case 'weekly':
      return `Semanalmente (${dateText})`;
    case 'monthly':
      return `Mensualmente (${format(nextDate, "'próximo' d 'de' MMMM", { locale: es })})`;
    case 'custom':
      return `Cada ${customDays} día${customDays !== 1 ? 's' : ''} (${dateText})`;
    default:
      return '';
  }
};

// Formato de fecha para inputs
export const formatDateForInput = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

// Formatear fecha en español
export const formatDateToSpanish = (date: Date): string => {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
};

// Verificar si una fecha está dentro de un intervalo
export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) });
};
// Obtener datos de los meses de un año
export const getMonths = (year: number) => {
  return Array.from({ length: 12 }, (_, i) => ({
    name: new Date(year, i).toLocaleString('es', { month: 'short' }),
    days: new Date(year, i + 1, 0).getDate(),
    number: i + 1
  }));
};

// Obtener fecha X días atrás
export const getDaysAgo = (date: Date, daysAgo: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - daysAgo);
  return result;
};

/**
 * Ajusta la fecha de fin cuando se cambia la fecha de inicio, preservando la duración original
 * @param originalStartDate - Fecha de inicio original
 * @param originalEndDate - Fecha de fin original (puede ser undefined)
 * @param newStartDate - Nueva fecha de inicio
 * @returns Nueva fecha de fin que preserva la duración, o undefined si no había fecha de fin
 */
export const adjustEndDateToStartDate = (
  originalStartDate: Date | undefined,
  originalEndDate: Date | undefined,
  newStartDate: Date
): Date | undefined => {
  // Si no hay fecha de fin original, retornar undefined
  if (!originalEndDate) {
    return undefined;
  }

  // Si no hay fecha de inicio original, establecer endDate como startDate + 1 hora por defecto
  if (!originalStartDate) {
    const defaultEndDate = new Date(newStartDate);
    defaultEndDate.setHours(defaultEndDate.getHours() + 1);
    return defaultEndDate;
  }

  // Calcular la duración original en milisegundos
  const originalDuration = originalEndDate.getTime() - originalStartDate.getTime();

  // Si la duración es negativa o cero, establecer endDate como startDate + 1 hora
  if (originalDuration <= 0) {
    const defaultEndDate = new Date(newStartDate);
    defaultEndDate.setHours(defaultEndDate.getHours() + 1);
    return defaultEndDate;
  }

  // Aplicar la misma duración a la nueva fecha de inicio
  const newEndDate = new Date(newStartDate.getTime() + originalDuration);

  // Safeguard: garantizar que endDate siempre sea posterior a startDate
  // Si la duración resultó en 0 o negativa, establecer mínimo 30 minutos
  if (newEndDate.getTime() <= newStartDate.getTime()) {
    newEndDate.setMinutes(newEndDate.getMinutes() + 30);
  }

  return newEndDate;
};

/**
 * Convierte una posición en pixels a minutos desde una hora base
 * @param pixels - Posición vertical en pixels
 * @param pixelsPerSlot - Pixels por slot (default 50px = 30 min)
 * @param minutesPerSlot - Minutos por slot (default 30)
 * @returns Minutos desde la hora base
 */
export const pixelsToMinutes = (
  pixels: number,
  pixelsPerSlot: number = 50,
  minutesPerSlot: number = 30
): number => {
  return (pixels / pixelsPerSlot) * minutesPerSlot;
};

/**
 * Convierte minutos desde una hora base a posición en pixels
 * @param minutes - Minutos desde la hora base
 * @param pixelsPerSlot - Pixels por slot (default 50px = 30 min)
 * @param minutesPerSlot - Minutos por slot (default 30)
 * @returns Posición vertical en pixels
 */
export const minutesToPixels = (
  minutes: number,
  pixelsPerSlot: number = 50,
  minutesPerSlot: number = 30
): number => {
  return (minutes / minutesPerSlot) * pixelsPerSlot;
};

/**
 * Calcula una nueva fecha/hora desde una posición en pixels en el calendario
 * @param topPixels - Posición vertical en pixels desde el inicio del calendario
 * @param baseDate - Fecha base para mantener día/mes/año
 * @param startHour - Hora de inicio del calendario (default 6 = 6:00 AM)
 * @returns Nueva fecha con la hora calculada
 */
export const pixelsToTime = (
  topPixels: number,
  baseDate: Date = new Date(),
  startHour: number = 6
): Date => {
  const minutesFromStart = pixelsToMinutes(topPixels);
  const newDate = new Date(baseDate);
  newDate.setHours(startHour, 0, 0, 0);
  newDate.setMinutes(minutesFromStart);
  return newDate;
};

/**
 * Redondea una fecha al intervalo más cercano
 * @param date - Fecha a redondear
 * @param intervalMinutes - Intervalo en minutos (default 15)
 * @returns Fecha redondeada
 */
export const snapToInterval = (date: Date, intervalMinutes: number = 15): Date => {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
  const newDate = new Date(date);
  newDate.setMinutes(roundedMinutes, 0, 0);
  return newDate;
};

/**
 * Calcula la posición en pixels para una fecha en el calendario
 * @param date - Fecha a convertir
 * @param startHour - Hora de inicio del calendario (default 6 = 6:00 AM)
 * @returns Posición vertical en pixels
 */
export const timeToPixels = (date: Date, startHour: number = 6): number => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
  return minutesToPixels(totalMinutesFromStart);
};
/**
 * Gets the start and end dates for a week containing the given date
 * @param date - Reference date
 * @returns Object with start (Sunday) and end (Saturday) dates
 */
export const getWeekDates = (date: Date): { start: Date; end: Date } => {
  const current = new Date(date);
  const dayOfWeek = current.getDay(); // 0 = Sunday
  
  const start = new Date(current);
  start.setDate(current.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Gets the start and end dates for a month containing the given date
 * @param date - Reference date
 * @returns Object with start (first day) and end (last day) dates
 */
export const getMonthDates = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};
