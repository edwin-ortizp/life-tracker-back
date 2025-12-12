/**
 * Event Layout Calculator
 *
 * Calculates positioning and dimensions for calendar events in the grid
 * Handles overlapping events similar to Google Calendar
 */

import { CalendarEvent, EventLayoutInfo } from '../types';
import { EXTERNAL_EVENT_Z_INDEX } from '../constants';
import { minutesToPixels } from '../../../utils/dates';

/**
 * Time slot configuration for the calendar grid
 * Note: Each 30-minute slot is 50px, so 1 hour = 100px
 */
const CALENDAR_CONFIG = {
  startHour: 6, // 6:00 AM
  endHour: 22, // 10:00 PM
  intervalMinutes: 30, // 30-minute slots (50px each)
};

/**
 * Convert time to pixel position from top of calendar
 *
 * @param date - Date with time
 * @returns Pixel position from top
 */
export function timeToPixels(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const totalMinutes = hours * 60 + minutes;
  const startMinutes = CALENDAR_CONFIG.startHour * 60;

  const minutesFromStart = totalMinutes - startMinutes;

  return minutesToPixels(minutesFromStart);
}

/**
 * Calculate height in pixels for an event
 *
 * @param startDate - Event start time
 * @param endDate - Event end time
 * @returns Height in pixels
 */
export function calculateEventHeight(startDate: Date, endDate: Date): number {
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  return minutesToPixels(durationMinutes);
}

/**
 * Check if two events overlap
 *
 * @param event1 - First event
 * @param event2 - Second event
 * @returns True if events overlap
 */
export function eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
  return event1.startDate < event2.endDate && event1.endDate > event2.startDate;
}

/**
 * Calculate layout information for a list of events
 * Handles overlapping events by adjusting width and position
 *
 * @param events - Array of calendar events
 * @returns Array of layout information
 */
export function calculateEventLayouts(events: CalendarEvent[]): EventLayoutInfo[] {
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) =>
    a.startDate.getTime() - b.startDate.getTime()
  );

  const layouts: EventLayoutInfo[] = [];
  const columns: CalendarEvent[][] = [];

  // Group overlapping events into columns
  for (const event of sortedEvents) {
    // Find the first column where this event doesn't overlap with any event
    let placed = false;

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const hasOverlap = column.some(colEvent => eventsOverlap(event, colEvent));

      if (!hasOverlap) {
        column.push(event);
        placed = true;
        break;
      }
    }

    // If no suitable column found, create a new one
    if (!placed) {
      columns.push([event]);
    }
  }

  // Calculate layout for each event
  for (const event of sortedEvents) {
    // Find which column this event is in
    let columnIndex = 0;
    let totalColumns = 1;

    for (let i = 0; i < columns.length; i++) {
      if (columns[i].includes(event)) {
        columnIndex = i;

        // Count how many columns have events overlapping with this event
        const overlappingColumns = columns.filter(column =>
          column.some(colEvent => eventsOverlap(event, colEvent))
        );
        totalColumns = overlappingColumns.length;
        break;
      }
    }

    const top = timeToPixels(event.startDate);
    const height = calculateEventHeight(event.startDate, event.endDate);

    // Calculate width and left position based on overlapping
    const widthPercent = 100 / totalColumns;
    const leftPercent = columnIndex * widthPercent;

    layouts.push({
      event,
      top,
      height,
      left: leftPercent,
      width: widthPercent,
      zIndex: EXTERNAL_EVENT_Z_INDEX,
    });
  }

  return layouts;
}

/**
 * Clamp event to visible calendar bounds
 * If event extends before/after visible hours, adjust its display
 *
 * @param layout - Event layout info
 * @returns Adjusted layout info
 */
export function clampEventToVisibleBounds(layout: EventLayoutInfo): EventLayoutInfo {
  const visibleStartPx = 0;
  const totalMinutes = (CALENDAR_CONFIG.endHour - CALENDAR_CONFIG.startHour) * 60;
  const visibleEndPx = minutesToPixels(totalMinutes);

  let { top, height } = layout;

  // Clamp top
  if (top < visibleStartPx) {
    const overflow = visibleStartPx - top;
    top = visibleStartPx;
    height = Math.max(0, height - overflow);
  }

  // Clamp bottom
  const bottom = top + height;
  if (bottom > visibleEndPx) {
    height = visibleEndPx - top;
  }

  return {
    ...layout,
    top,
    height,
  };
}
