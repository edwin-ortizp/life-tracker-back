/**
 * ExternalCalendarEvent Component
 *
 * Displays a single external calendar event in the calendar grid
 */

import { useState } from 'react';
import { ExternalCalendar, EventLayoutInfo } from '../types';
import { EXTERNAL_EVENT_STYLES } from '../constants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EyeOff, Eye, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExternalCalendarEventProps {
  layout: EventLayoutInfo;
  calendar: ExternalCalendar;
  isHidden: boolean;
  onToggleVisibility: (eventUid: string) => void;
}

export function ExternalCalendarEvent({
  layout,
  calendar,
  isHidden,
  onToggleVisibility,
}: ExternalCalendarEventProps) {
  const [open, setOpen] = useState(false);
  const { event } = layout;

  // Calculate background color with opacity
  const backgroundColor = hexToRgba(calendar.color, EXTERNAL_EVENT_STYLES.opacityBackground);
  const borderColor = hexToRgba(calendar.color, EXTERNAL_EVENT_STYLES.opacityBorder);

  // Format time display
  const startTime = format(event.startDate, 'h:mm a', { locale: es });
  const endTime = format(event.endDate, 'h:mm a', { locale: es });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="absolute cursor-pointer rounded-md px-2 py-1 text-xs overflow-hidden transition-opacity hover:opacity-90"
          style={{
            top: `${layout.top}px`,
            height: `${Math.max(layout.height, 20)}px`,
            left: `${layout.left}%`,
            width: `${layout.width}%`,
            zIndex: layout.zIndex,
            backgroundColor,
            borderLeft: `${EXTERNAL_EVENT_STYLES.borderWidth} ${EXTERNAL_EVENT_STYLES.borderStyle} ${borderColor}`,
          }}
        >
          <div className="font-medium truncate" style={{ color: calendar.color }}>
            {event.summary}
          </div>
          {layout.height > 30 && (
            <div className="text-xs opacity-75 truncate" style={{ color: calendar.color }}>
              {startTime}
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80" side="right" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{event.summary}</h4>
              <Badge
                variant="outline"
                className="mt-1"
                style={{
                  borderColor: calendar.color,
                  color: calendar.color,
                }}
              >
                {calendar.name}
              </Badge>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {format(event.startDate, "EEEE, d 'de' MMMM", { locale: es })}
            </span>
          </div>

          <div className="text-sm text-muted-foreground pl-6">
            {startTime} - {endTime}
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="text-sm text-muted-foreground border-t pt-2">
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                onToggleVisibility(event.uid);
                setOpen(false);
              }}
            >
              {isHidden ? (
                <>
                  <Eye className="w-4 h-4" />
                  Mostrar evento
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Ocultar evento
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground mt-2 px-2">
              {isHidden
                ? 'Este evento está oculto solo en Life Tracker'
                : 'Ocultar este evento solo lo esconde en Life Tracker, no lo elimina de Google Calendar'}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
