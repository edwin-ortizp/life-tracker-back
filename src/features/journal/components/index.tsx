import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { JournalHeader } from './JournalHeader';
import { JournalInput } from './JournalInput';
import { PasswordProtection } from './PasswordProtection';
import { PrivateTaskSection } from '@/features/task/components/PrivateTaskSection';
import ExportRangeButton from './ExportRangeButton';
import JournalAiRewrite from './JournalAiRewrite';
import { LastUpdatedInfo } from './LastUpdatedInfo';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useJournalData } from '../hooks/useJournalData';
import { useJournalEntry } from '../context/JournalEntryContext';
import type { JournalProps } from '../types';

export const Journal: React.FC<JournalProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const {
    entry,
    setEntry,
    status,
    error,
    saveEntry,
    lastUpdated
  } = useJournalData(selectedDate);

  const { entry: sharedEntry, setEntry: setSharedEntry } = useJournalEntry();

  useEffect(() => {
    setSharedEntry(entry);
  }, [entry, setSharedEntry]);

  const handleLock = () => {
    setIsUnlocked(false);
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
        onUnlock={() => setIsUnlocked(true)} 
        lastUpdated={lastUpdated}
      />
    );
  }
  return (
    <>
      <Card className="w-full">
        <CardContent className="p-4">
          <JournalHeader
            status={status}
            onLock={handleLock}
            isUnlocked={isUnlocked}
          />
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
        <CardFooter className="flex flex-col items-end gap-2 sm:flex-row sm:justify-between">
          <LastUpdatedInfo lastUpdated={lastUpdated} />
          <div className="flex gap-2">
            <Button
              onClick={() => saveEntry(sharedEntry)}
              disabled={status === 'saving'}
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
            <JournalAiRewrite entry={sharedEntry} />
            <ExportRangeButton />
          </div>
        </CardFooter>
      </Card>
      <PrivateTaskSection selectedDate={selectedDate} />
    </>
  );
};
export * from "./MarkdownJournal";
export * from "./ExportRangeButton";
export * from "./JournalAiRewrite";
export default Journal;
