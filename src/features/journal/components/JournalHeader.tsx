import React from 'react';
import { Book, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface JournalHeaderProps {
  status: string;
  onLock: () => void;
  isUnlocked: boolean;
  resync: () => Promise<void>;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  status,
  onLock,
  resync
}) => {
  const { isOnline } = useNetworkStatus();
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2">
        <Book className="w-5 h-5" />
        <span className="font-medium">Mi Diario</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </span>
          {status === 'saving' && (
            <span className="text-sm text-blue-500">Guardando...</span>
          )}
          {status === 'pending' && (
            <span className="text-sm text-yellow-600">Pendiente de sincronizar</span>
          )}
          {status === 'saved' && (
            <span className="text-sm text-green-500">Guardado</span>
          )}
          {status === 'error' && (
            <span className="text-sm text-red-500">Error al guardar</span>
          )}
          {!isOnline && (
            <span className="text-sm text-orange-600">Offline</span>
          )}
          <Button onClick={resync} variant="link" className="p-0 h-auto text-xs">
            Reintentar
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onLock}
          title="Bloquear diario"
        >
          <Lock className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};