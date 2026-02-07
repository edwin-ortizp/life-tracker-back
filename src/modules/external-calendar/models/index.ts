/**
 * External Calendar Types
 *
 * Types for managing external calendar integrations (Google Calendar via public iCal URLs)
 */

/**
 * External calendar configuration
 * Represents a calendar added by the user via public iCal URL
 */
export interface ExternalCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSyncedAt?: number;
}

/**
 * Calendar event from external source
 * Parsed from iCal format
 */
export interface CalendarEvent {
  uid: string;
  calendarId: string;
  summary: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  location?: string;
}

/**
 * LocalStorage structure for external calendars
 */
export interface ExternalCalendarStorage {
  calendars: ExternalCalendar[];
  events: CalendarEvent[];
  hiddenEventIds: string[];
  lastGlobalSync?: number;
}

/**
 * Sync status for a calendar
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Sync result for a single calendar
 */
export interface CalendarSyncResult {
  calendarId: string;
  status: SyncStatus;
  eventCount?: number;
  error?: string;
}

/**
 * Event layout information for rendering
 * Used to calculate position and overlapping
 */
export interface EventLayoutInfo {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

/**
 * Predefined calendar colors
 */
export const CALENDAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
] as const;

export type CalendarColor = typeof CALENDAR_COLORS[number];
