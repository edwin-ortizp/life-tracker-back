import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { JournalHeader } from './JournalHeader';
import { JournalInput } from './JournalInput';
import { PasswordProtection } from './PasswordProtection';
import { PrivateTaskSection } from '@/features/task/components/PrivateTaskSection';
import JournalAiMenu from './JournalAiMenu';
import { LastUpdatedInfo } from './LastUpdatedInfo';
import { Button } from '@/components/ui/button';
import { Save, Download } from 'lucide-react';
import { useJournalData } from '../hooks/useJournalData.supabase';
import { useJournalEntry } from '../context/JournalEntryContext';
import { useJournalLock } from '../context/JournalLockContext';
import type { JournalProps } from '../types';

export const Journal: React.FC<JournalProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const { isUnlocked, setUnlocked } = useJournalLock();
  const [_isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const {
    entry,
    setEntry,
    status,
    error,
    saveEntry,
    lastUpdated,
  } = useJournalData(selectedDate);

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
          <div className="flex justify-between items-center w-full">
            <LastUpdatedInfo lastUpdated={lastUpdated} />
            <div className="flex gap-2">
              <Button
                onClick={() => saveEntry(sharedEntry)}
                disabled={status === "saving"}
              >
              {status === 'saving' ? (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4 animate-spin" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
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
                onReplace={(text) => {
                  setSharedEntry(text);
                  setEntry(text);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportWizardOpen(true)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
      </Card>
      <PrivateTaskSection selectedDate={selectedDate} />
    </>
  );
};
export * from "./MarkdownJournal";
export * from "./JournalAiMenu";
export * from "./LifeCalendar";
export default Journal;
