/**
 * LocalStorage Utilities for External Calendars
 *
 * Handles persistence of calendar configurations, events, and hidden event IDs
 */

import { ExternalCalendar, CalendarEvent, ExternalCalendarStorage } from '../models';
import { EXTERNAL_CALENDAR_STORAGE_KEY } from '../constants';

/**
 * Get all external calendar data from localStorage
 */
export function getStoredCalendarData(): ExternalCalendarStorage {
  try {
    const stored = localStorage.getItem(EXTERNAL_CALENDAR_STORAGE_KEY);
    if (!stored) {
      return getEmptyStorage();
    }

    const parsed = JSON.parse(stored) as ExternalCalendarStorage;

    // Convert date strings back to Date objects
    const events = parsed.events.map(event => ({
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
    }));

    return {
      calendars: parsed.calendars || [],
      events,
      hiddenEventIds: parsed.hiddenEventIds || [],
      lastGlobalSync: parsed.lastGlobalSync,
    };
  } catch (error) {
    console.error('Error reading external calendar data from localStorage:', error);
    return getEmptyStorage();
  }
}

/**
 * Save external calendar data to localStorage
 */
export function saveCalendarData(data: ExternalCalendarStorage): void {
  try {
    localStorage.setItem(EXTERNAL_CALENDAR_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving external calendar data to localStorage:', error);
    throw new Error('No se pudo guardar la configuración de calendarios');
  }
}

/**
 * Get all calendars
 */
export function getCalendars(): ExternalCalendar[] {
  const data = getStoredCalendarData();
  return data.calendars;
}

/**
 * Add a new calendar
 */
export function addCalendar(calendar: ExternalCalendar): void {
  const data = getStoredCalendarData();
  data.calendars.push(calendar);
  saveCalendarData(data);
}

/**
 * Update an existing calendar
 */
export function updateCalendar(calendarId: string, updates: Partial<ExternalCalendar>): void {
  const data = getStoredCalendarData();
  const index = data.calendars.findIndex(cal => cal.id === calendarId);

  if (index !== -1) {
    data.calendars[index] = { ...data.calendars[index], ...updates };
    saveCalendarData(data);
  }
}

/**
 * Remove a calendar and all its events
 */
export function removeCalendar(calendarId: string): void {
  const data = getStoredCalendarData();

  // Remove calendar
  data.calendars = data.calendars.filter(cal => cal.id !== calendarId);

  // Remove all events from this calendar
  data.events = data.events.filter(event => event.calendarId !== calendarId);

  // Remove hidden event IDs from this calendar
  const removedEventUids = data.events
    .filter(event => event.calendarId === calendarId)
    .map(event => event.uid);

  data.hiddenEventIds = data.hiddenEventIds.filter(
    uid => !removedEventUids.includes(uid)
  );

  saveCalendarData(data);
}

/**
 * Get all events
 */
export function getEvents(): CalendarEvent[] {
  const data = getStoredCalendarData();
  return data.events;
}

/**
 * Get events for a specific calendar
 */
export function getCalendarEvents(calendarId: string): CalendarEvent[] {
  const data = getStoredCalendarData();
  return data.events.filter(event => event.calendarId === calendarId);
}

/**
 * Save events for a specific calendar (replaces all events for that calendar)
 */
export function saveCalendarEvents(calendarId: string, events: CalendarEvent[]): void {
  const data = getStoredCalendarData();

  // Remove old events from this calendar
  data.events = data.events.filter(event => event.calendarId !== calendarId);

  // Add new events
  data.events.push(...events);

  // Update last sync time for this calendar
  const calendarIndex = data.calendars.findIndex(cal => cal.id === calendarId);
  if (calendarIndex !== -1) {
    data.calendars[calendarIndex].lastSyncedAt = Date.now();
  }

  saveCalendarData(data);
}

/**
 * Get hidden event IDs
 */
export function getHiddenEventIds(): string[] {
  const data = getStoredCalendarData();
  return data.hiddenEventIds;
}

/**
 * Hide an event (add to hidden list)
 */
export function hideEvent(eventUid: string): void {
  const data = getStoredCalendarData();

  if (!data.hiddenEventIds.includes(eventUid)) {
    data.hiddenEventIds.push(eventUid);
    saveCalendarData(data);
  }
}

/**
 * Show an event (remove from hidden list)
 */
export function showEvent(eventUid: string): void {
  const data = getStoredCalendarData();
  data.hiddenEventIds = data.hiddenEventIds.filter(uid => uid !== eventUid);
  saveCalendarData(data);
}

/**
 * Update global sync timestamp
 */
export function updateGlobalSyncTime(): void {
  const data = getStoredCalendarData();
  data.lastGlobalSync = Date.now();
  saveCalendarData(data);
}

/**
 * Clear all external calendar data
 */
export function clearAllCalendarData(): void {
  try {
    localStorage.removeItem(EXTERNAL_CALENDAR_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing external calendar data:', error);
  }
}

/**
 * Get empty storage structure
 */
function getEmptyStorage(): ExternalCalendarStorage {
  return {
    calendars: [],
    events: [],
    hiddenEventIds: [],
  };
}
