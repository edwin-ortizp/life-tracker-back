// src/utils/dates.ts

// Obtiene la fecha local en formato YYYY-MM-DD
export const getLocalDateString = (date: Date) => {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toISOString()
    .split('T')[0];
};

// Obtiene una fecha formateada con UTC explícito
export const getUTCFormattedDateTime = (date: Date) => {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset) / 60);
  const mins = Math.abs(offset) % 60;
  return date.toLocaleString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }) + ` UTC${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Crea un timestamp manteniendo la información de UTC
export const createUTCTimestamp = (baseDate: Date, hours: number, minutes: number) => {
  const localDate = new Date(baseDate);
  localDate.setHours(hours, minutes, 0, 0);
  return {
      timestamp: localDate.getTime(),
      utcOffset: -localDate.getTimezoneOffset()
  };
};