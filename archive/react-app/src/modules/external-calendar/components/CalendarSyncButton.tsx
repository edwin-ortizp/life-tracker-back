/**
 * CalendarSyncButton Component
 *
 * Button for manually syncing all calendars
 * Shows sync status and last sync time
 */

import { Button } from '@/shared/components/ui/button';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { SyncStatus } from '../models';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarSyncButtonProps {
  onSync: () => void;
  syncStatus: SyncStatus;
  lastSyncTime?: number;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function CalendarSyncButton({
  onSync,
  syncStatus,
  lastSyncTime,
  variant = 'outline',
  size = 'default',
  showText = true,
}: CalendarSyncButtonProps) {
  const isSyncing = syncStatus === 'syncing';
  const isSuccess = syncStatus === 'success';
  const isError = syncStatus === 'error';

  // Determine button text
  let buttonText = 'Sincronizar';
  if (isSyncing) buttonText = 'Sincronizando...';
  if (isSuccess) buttonText = 'Sincronizado';
  if (isError) buttonText = 'Error al sincronizar';

  // Determine icon
  let Icon = RefreshCw;
  if (isSuccess) Icon = Check;
  if (isError) Icon = AlertCircle;

  // Format last sync time
  const lastSyncText = lastSyncTime
    ? `Última sincronización: ${formatDistanceToNow(lastSyncTime, { locale: es, addSuffix: true })}`
    : 'Nunca sincronizado';

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={onSync}
        disabled={isSyncing}
        className={isError ? 'border-destructive text-destructive' : ''}
      >
        <Icon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''} ${showText ? 'mr-2' : ''}`} />
        {showText && buttonText}
      </Button>

      {showText && lastSyncTime !== undefined && (
        <p className="text-xs text-muted-foreground">{lastSyncText}</p>
      )}
    </div>
  );
}
