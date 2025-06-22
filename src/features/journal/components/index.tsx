import React, { useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { JournalHeader } from './JournalHeader';
import { JournalInput } from './JournalInput';
import { PasswordProtection } from './PasswordProtection';
import { PrivateTaskSection } from '@/features/task/components/PrivateTaskSection';
import ExportRangeButton from './ExportRangeButton';
import JournalAiMenu from './JournalAiMenu';
import { LastUpdatedInfo } from './LastUpdatedInfo';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useJournalData } from '../hooks/useJournalData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useJournalEntry } from '../context/JournalEntryContext';
import { useJournalLock } from '../context/JournalLockContext';
import type { JournalProps } from '../types';

export const Journal: React.FC<JournalProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const { isUnlocked, setUnlocked } = useJournalLock();
  const {
    entry,
    setEntry,
    status,
    error,
    saveEntry,
    lastUpdated,
    resync
  } = useJournalData(selectedDate);
  const { isOnline } = useNetworkStatus();

  const { entry: sharedEntry, setEntry: setSharedEntry } = useJournalEntry();

  useEffect(() => {
    setSharedEntry(entry);
  }, [entry, setSharedEntry]);

  const handleLock = () => {
    setUnlocked(false);
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para usar el diario</p>
        </CardContent>
      </Card>
    );
  }

  if (!isUnlocked) {
    return (
      <PasswordProtection 
        onUnlock={() => setUnlocked(true)}
        lastUpdated={lastUpdated}
      />
    );
  }
  return (
    <>
      <Card className="w-full">
        <CardContent className="p-4">
          <JournalHeader onLock={handleLock} />
          <JournalInput
            value={sharedEntry}
            onChange={(value) => {
              setSharedEntry(value);
              setEntry(value);
            }}
          />
          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-between items-center w-full">
            <LastUpdatedInfo lastUpdated={lastUpdated} />
            <div className="flex gap-2">
              <Button
                onClick={() => saveEntry(sharedEntry)}
                disabled={status === 'saving' || !isOnline}
              >
              {status === 'saving' ? (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar entrada
                </span>
              )}
            </Button>
              <JournalAiMenu
                entry={sharedEntry}
                selectedDate={selectedDate}
                onInsert={(text) => {
                  setSharedEntry(prev => prev + (prev ? '\n' : '') + text);
                  setEntry(prev => prev + (prev ? '\n' : '') + text);
                }}
              />
              <ExportRangeButton />
            </div>
          </div>
          <div className="flex justify-center items-center gap-2 text-xs">
            {status === 'saving' && (
              <span className="text-blue-500">Guardando...</span>
            )}
            {status === 'pending' && (
              <span className="text-yellow-600">Pendiente de sincronizar</span>
            )}
            {status === 'saved' && (
              <span className="text-green-600">Sincronizado</span>
            )}
            {status === 'error' && (
              <span className="text-red-600">Error de sincronización</span>
            )}
            {!isOnline && <span className="text-orange-600">Offline</span>}
            <Button onClick={resync} variant="link" className="p-0 h-auto text-xs">Reintentar</Button>
          </div>
        </CardFooter>
      </Card>
      <PrivateTaskSection selectedDate={selectedDate} />
    </>
  );
};
export * from "./MarkdownJournal";
export * from "./ExportRangeButton";
export * from "./JournalAiMenu";
export default Journal;
