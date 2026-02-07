/**
 * useExternalCalendars Hook
 *
 * Main hook for managing external calendar integrations
 * Handles syncing, CRUD operations, and event visibility
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ExternalCalendar,
  CalendarEvent,
  SyncStatus,
  CalendarSyncResult,
} from '../models';
import {
  addCalendar as addCalendarToStorage,
  updateCalendar as updateCalendarInStorage,
  removeCalendar as removeCalendarFromStorage,
  saveCalendarEvents,
  hideEvent as hideEventInStorage,
  showEvent as showEventInStorage,
  updateGlobalSyncTime,
  getStoredCalendarData,
} from '@/modules/external-calendar/utils/storage';
import { fetchAndParseICalEvents, getEventsForDay } from '@/modules/external-calendar/utils/icalParser';
import { SYNC_TIMEOUT_MS, DEFAULT_CALENDAR_COLOR } from '../constants';

export function useExternalCalendars() {
  const [calendars, setCalendars] = useState<ExternalCalendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [hiddenEventIds, setHiddenEventIds] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | undefined>();

  // Load initial data from localStorage
  useEffect(() => {
    loadFromStorage();
  }, []);

  /**
   * Load all data from localStorage
   */
  const loadFromStorage = useCallback(() => {
    const data = getStoredCalendarData();
    setCalendars(data.calendars);
    setEvents(data.events);
    setHiddenEventIds(data.hiddenEventIds);
    setLastSyncTime(data.lastGlobalSync);
  }, []);

  /**
   * Add a new calendar
   */
  const addCalendar = useCallback((name: string, url: string, color?: string) => {
    const newCalendar: ExternalCalendar = {
      id: generateCalendarId(),
      name,
      url,
      color: color || DEFAULT_CALENDAR_COLOR,
      enabled: true,
    };

    addCalendarToStorage(newCalendar);
    setCalendars(prev => [...prev, newCalendar]);

    return newCalendar;
  }, []);

  /**
   * Update an existing calendar
   */
  const updateCalendar = useCallback((
    calendarId: string,
    updates: Partial<ExternalCalendar>
  ) => {
    updateCalendarInStorage(calendarId, updates);
    setCalendars(prev =>
      prev.map(cal => (cal.id === calendarId ? { ...cal, ...updates } : cal))
    );
  }, []);

  /**
   * Remove a calendar
   */
  const removeCalendar = useCallback((calendarId: string) => {
    removeCalendarFromStorage(calendarId);
    setCalendars(prev => prev.filter(cal => cal.id !== calendarId));
    setEvents(prev => prev.filter(event => event.calendarId !== calendarId));
  }, []);

  /**
   * Toggle calendar enabled/disabled
   */
  const toggleCalendar = useCallback((calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    if (calendar) {
      updateCalendar(calendarId, { enabled: !calendar.enabled });
    }
  }, [calendars, updateCalendar]);

  /**
   * Sync a single calendar
   */
  const syncCalendar = useCallback(
    async (calendarId: string): Promise<CalendarSyncResult> => {
      const calendar = calendars.find(cal => cal.id === calendarId);

      if (!calendar) {
        return {
          calendarId,
          status: 'error',
          error: 'Calendario no encontrado',
        };
      }

      try {
        const fetchedEvents = await fetchAndParseICalEvents(
          calendar.url,
          calendarId,
          SYNC_TIMEOUT_MS
        );

        // Save to storage and update state
        saveCalendarEvents(calendarId, fetchedEvents);
        setEvents(prev => [
          ...prev.filter(e => e.calendarId !== calendarId),
          ...fetchedEvents,
        ]);

        // Update last synced time
        const now = Date.now();
        updateCalendarInStorage(calendarId, { lastSyncedAt: now });
        setCalendars(prev =>
          prev.map(cal =>
            cal.id === calendarId ? { ...cal, lastSyncedAt: now } : cal
          )
        );

        return {
          calendarId,
          status: 'success',
          eventCount: fetchedEvents.length,
        };
      } catch (error) {
        console.error(`Error syncing calendar ${calendarId}:`, error);
        return {
          calendarId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido',
        };
      }
    },
    [calendars]
  );

  /**
   * Sync all enabled calendars
   */
  const syncAllCalendars = useCallback(async (): Promise<CalendarSyncResult[]> => {
    setSyncStatus('syncing');

    const enabledCalendars = calendars.filter(cal => cal.enabled);

    if (enabledCalendars.length === 0) {
      setSyncStatus('idle');
      return [];
    }

    try {
      // Sync all calendars in parallel
      const results = await Promise.all(
        enabledCalendars.map(cal => syncCalendar(cal.id))
      );

      // Update global sync time
      const now = Date.now();
      updateGlobalSyncTime();
      setLastSyncTime(now);

      // Check if any failed
      const hasErrors = results.some(r => r.status === 'error');
      setSyncStatus(hasErrors ? 'error' : 'success');

      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);

      return results;
    } catch (error) {
      console.error('Error syncing calendars:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return [];
    }
  }, [calendars, syncCalendar]);

  /**
   * Hide an event
   */
  const hideEvent = useCallback((eventUid: string) => {
    hideEventInStorage(eventUid);
    setHiddenEventIds(prev => [...prev, eventUid]);
  }, []);

  /**
   * Show a hidden event
   */
  const showEvent = useCallback((eventUid: string) => {
    showEventInStorage(eventUid);
    setHiddenEventIds(prev => prev.filter(uid => uid !== eventUid));
  }, []);

  /**
   * Get visible events (not hidden)
   */
  const getVisibleEvents = useCallback((): CalendarEvent[] => {
    return events.filter(event => {
      // Check if event is hidden
      if (hiddenEventIds.includes(event.uid)) {
        return false;
      }

      // Check if calendar is enabled
      const calendar = calendars.find(cal => cal.id === event.calendarId);
      return calendar?.enabled ?? false;
    });
  }, [events, hiddenEventIds, calendars]);

  /**
   * Get visible events for a specific day
   */
  const getVisibleEventsForDay = useCallback((date: Date): CalendarEvent[] => {
    const visibleEvents = getVisibleEvents();
    return getEventsForDay(visibleEvents, date);
  }, [getVisibleEvents]);

  /**
   * Check if an event is hidden
   */
  const isEventHidden = useCallback(
    (eventUid: string): boolean => {
      return hiddenEventIds.includes(eventUid);
    },
    [hiddenEventIds]
  );

  return {
    // State
    calendars,
    events,
    visibleEvents: getVisibleEvents(),
    hiddenEventIds,
    syncStatus,
    lastSyncTime,

    // Calendar CRUD
    addCalendar,
    updateCalendar,
    removeCalendar,
    toggleCalendar,

    // Sync
    syncCalendar,
    syncAllCalendars,

    // Event visibility
    hideEvent,
    showEvent,
    isEventHidden,

    // Queries
    getVisibleEventsForDay,

    // Utilities
    loadFromStorage,
  };
}

/**
 * Generate unique calendar ID
 */
function generateCalendarId(): string {
  return `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
