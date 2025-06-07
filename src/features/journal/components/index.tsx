import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { JournalHeader } from './JournalHeader';
import { JournalInput } from './JournalInput';
import { PasswordProtection } from './PasswordProtection';
import { PrivateTaskSection } from '@/features/task/components/PrivateTaskSection';
import ExportWeekButton from './ExportWeekButton';
import { useJournalData } from '../hooks/useJournalData';
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
            value={entry}
            onChange={(value) => {
              setEntry(value);
            }}
            onSave={() => saveEntry(entry)}
            status={status}
            lastUpdated={lastUpdated}
          />
          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <ExportWeekButton weekDate={selectedDate} />
        </CardFooter>
      </Card>
      <PrivateTaskSection selectedDate={selectedDate} />
    </>
  );
};
export * from "./MarkdownJournal";
export * from "./ExportWeekButton";
export default Journal;
