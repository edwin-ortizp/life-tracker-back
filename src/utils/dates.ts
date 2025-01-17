// src/utils/dates.ts

// Obtiene la fecha local en formato YYYY-MM-DD
export const getLocalDateString = (date: Date) => {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    .toISOString()
    .split('T')[0];
};

export const formatDateToSpanishWithUTC = (date: Date): string => {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  // Formato de 12 horas con AM/PM
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12;
  hours = hours ? hours : 12; // la hora '0' debe ser '12'

  // Calcular offset UTC
  const offset = -date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const sign = offset >= 0 ? '+' : '-';

  return `${day} de ${month} de ${year}, ${hours}:${minutes}:${seconds} ${ampm} UTC${sign}${offsetHours}`;
};

// Función auxiliar para crear timestamps con el nuevo formato
export const createFormattedTimestamp = (baseDate: Date, hours: number, minutes: number) => {
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  
  return {
    timestamp: date.getTime(),
    utcOffset: -date.getTimezoneOffset(),
    formatted: formatDateToSpanishWithUTC(date)
  };
};