/**
 * CalendarListItem Component
 *
 * Displays a single calendar in the settings list with actions
 */

import { ExternalCalendar } from '../types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CalendarListItemProps {
  calendar: ExternalCalendar;
  onToggle: (calendarId: string) => void;
  onRemove: (calendarId: string) => void;
  onSync: (calendarId: string) => void;
  isSyncing?: boolean;
}

export function CalendarListItem({
  calendar,
  onToggle,
  onRemove,
  onSync,
  isSyncing = false,
}: CalendarListItemProps) {
  const lastSyncText = calendar.lastSyncedAt
    ? `Sincronizado ${formatDistanceToNow(calendar.lastSyncedAt, { locale: es, addSuffix: true })}`
    : 'Nunca sincronizado';

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      {/* Color Indicator */}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: calendar.color }}
      />

      {/* Calendar Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium truncate">{calendar.name}</h4>
          {!calendar.enabled && (
            <Badge variant="secondary" className="text-xs">
              Deshabilitado
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{calendar.url}</p>
        <p className="text-xs text-muted-foreground mt-1">{lastSyncText}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Sync Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSync(calendar.id)}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>

        {/* Enable/Disable Toggle */}
        <Switch
          checked={calendar.enabled}
          onCheckedChange={() => onToggle(calendar.id)}
        />

        {/* Remove Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar calendario?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará "{calendar.name}" y todos sus eventos de Life Tracker. Esta acción no
                afecta tu calendario en Google Calendar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(calendar.id)}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
