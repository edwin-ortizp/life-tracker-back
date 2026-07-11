/**
 * External Calendar Constants
 */

import { CALENDAR_COLORS } from './models';

/**
 * LocalStorage key for external calendar data
 */
export const EXTERNAL_CALENDAR_STORAGE_KEY = 'life-tracker-external-calendars';

/**
 * Default color palette for calendars
 */
export const DEFAULT_CALENDAR_COLORS = CALENDAR_COLORS;

/**
 * Default calendar color (blue)
 */
export const DEFAULT_CALENDAR_COLOR = CALENDAR_COLORS[0];

/**
 * Sync timeout in milliseconds (10 seconds per calendar)
 */
export const SYNC_TIMEOUT_MS = 10000;

/**
 * Cache expiry time in milliseconds (7 days)
 */
export const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Z-index for external calendar events in the calendar grid
 * Background: 1, External Events: 4, Habits: 5, Tasks: 10
 */
export const EXTERNAL_EVENT_Z_INDEX = 4;

/**
 * Visual styles for external calendar events
 */
export const EXTERNAL_EVENT_STYLES = {
  borderWidth: '2px',
  borderStyle: 'dashed',
  opacityBackground: 0.4,
  opacityBorder: 1.0,
} as const;
