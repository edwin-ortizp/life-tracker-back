import { format } from 'date-fns';

export interface GoogleCalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}

/**
 * Genera URL de Google Calendar para crear un evento
 */
export function generateGoogleCalendarUrl(event: GoogleCalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams();

  params.append('action', 'TEMPLATE');
  params.append('text', event.title);

  // Formato de fechas: YYYYMMDDTHHmmss (local time sin Z, se usa ctz para timezone)
  const formatDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const startDateStr = formatDate(event.startDate);
  const endDateStr = event.endDate
    ? formatDate(event.endDate)
    : formatDate(new Date(event.startDate.getTime() + 60 * 60 * 1000)); // +1 hora por defecto

  params.append('dates', `${startDateStr}/${endDateStr}`);

  if (event.description) {
    params.append('details', event.description);
  }

  if (event.location) {
    params.append('location', event.location);
  }

  // Timezone (opcional, para mostrar la hora correcta al usuario)
  params.append('ctz', 'America/Bogota');

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Abre Google Calendar en nueva pestaña para crear evento
 */
export function openGoogleCalendar(event: GoogleCalendarEvent): void {
  const url = generateGoogleCalendarUrl(event);
  window.open(url, '_blank', 'noopener,noreferrer');
}
