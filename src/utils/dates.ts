// Obtiene la fecha local en formato YYYY-MM-DD considerando la zona horaria del usuario
export const getLocalDateString = (date: Date = new Date()): string => {
  // Creamos una nueva fecha basada en la timestamp
  const localDate = new Date(date.getTime());
  
  // Ajustamos a medianoche en la zona horaria local
  localDate.setHours(0, 0, 0, 0);
  
  // Retornamos en formato YYYY-MM-DD
  return localDate.toISOString().split('T')[0];
};

// Función auxiliar para verificar si dos timestamps están en el mismo día local
export const areSameLocalDay = (timestamp1: number, timestamp2: number): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  
  return getLocalDateString(date1) === getLocalDateString(date2);
};

// La función formatDateToSpanishWithUTC permanece igual
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

export const createFormattedTimestamp = (baseDate: Date, hours: number, minutes: number) => {
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  
  return {
    timestamp: date.getTime(),
    utcOffset: -date.getTimezoneOffset(),
    formatted: formatDateToSpanishWithUTC(date)
  };
};