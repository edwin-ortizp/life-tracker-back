/**
 * iCal Parser Utility
 *
 * Parses iCal (.ics) format from Google Calendar public URLs
 */

import ICAL from 'ical.js';
import { CalendarEvent } from '../types';

/**
 * Parse iCal data and extract events
 *
 * @param icalData - Raw iCal data string
 * @param calendarId - ID of the calendar these events belong to
 * @returns Array of parsed calendar events
 */
export function parseICalEvents(icalData: string, calendarId: string): CalendarEvent[] {
  try {
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    const events: CalendarEvent[] = [];

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);

      // Extract basic event data
      const uid = event.uid || generateFallbackUid();
      const summary = event.summary || 'Ocupado';
      const description = event.description || undefined;
      const location = event.location || undefined;

      // Parse dates
      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate.toJSDate();

      // Check if all-day event
      const isAllDay = !event.startDate.isDate ? false : true;

      events.push({
        uid,
        calendarId,
        summary,
        description,
        startDate,
        endDate,
        isAllDay,
        location,
      });
    }

    return events;
  } catch (error) {
    console.error('Error parsing iCal data:', error);
    throw new Error('No se pudo parsear el calendario. Verifica que la URL sea válida.');
  }
}

/**
 * Fetch and parse iCal data from a URL
 *
 * @param url - Public iCal URL
 * @param calendarId - ID of the calendar
 * @param timeoutMs - Timeout in milliseconds (default 10000)
 * @returns Array of parsed calendar events
 */
export async function fetchAndParseICalEvents(
  url: string,
  calendarId: string,
  timeoutMs: number = 10000
): Promise<CalendarEvent[]> {
  try {
    // Validate URL
    if (!isValidICalUrl(url)) {
      throw new Error('URL inválida. Debe ser una URL pública de Google Calendar en formato iCal.');
    }

    // Use CORS proxy to bypass browser CORS restrictions
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(corsProxyUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/calendar',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error al descargar el calendario: ${response.status} ${response.statusText}`);
    }

    const icalData = await response.text();

    // Parse the iCal data
    return parseICalEvents(icalData, calendarId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado. La URL del calendario no responde.');
      }
      throw error;
    }
    throw new Error('Error desconocido al sincronizar el calendario.');
  }
}

/**
 * Validate iCal URL format
 *
 * @param url - URL to validate
 * @returns True if valid iCal URL
 */
export function isValidICalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Must be HTTPS
    if (urlObj.protocol !== 'https:') {
      return false;
    }

    // Should contain calendar.google.com or end with .ics
    const isGoogleCalendar = urlObj.hostname.includes('calendar.google.com');
    const isIcsFile = url.endsWith('.ics');

    return isGoogleCalendar || isIcsFile;
  } catch {
    return false;
  }
}

/**
 * Generate fallback UID for events without one
 */
function generateFallbackUid(): string {
  return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Filter events by date range
 *
 * @param events - Array of events to filter
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Filtered events
 */
export function filterEventsByDateRange(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  return events.filter(event => {
    // Event overlaps with the date range if:
    // - Event starts before range ends AND
    // - Event ends after range starts
    return event.startDate < endDate && event.endDate > startDate;
  });
}

/**
 * Get events for a specific day
 *
 * @param events - Array of events
 * @param date - Target date
 * @returns Events on that day
 */
export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return filterEventsByDateRange(events, dayStart, dayEnd);
}
