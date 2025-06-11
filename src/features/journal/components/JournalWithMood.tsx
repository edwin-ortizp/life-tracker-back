import React from 'react';
import { Journal } from '@/features/journal/components';
import { Mood } from '@/features/mood/components';
import { JournalEntryProvider } from '../context/JournalEntryContext';
import { JournalLockProvider } from '../context/JournalLockContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smile } from 'lucide-react';

interface JournalWithMoodProps {
  selectedDate: Date;
}

export const JournalWithMood: React.FC<JournalWithMoodProps> = ({ selectedDate }) => {
  return (
    <JournalEntryProvider>
      <JournalLockProvider>
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Panel principal - Diario */}
            <div className="md:col-span-2">
              <Journal selectedDate={selectedDate} />
            </div>

          {/* Panel lateral - Estados de ánimo */}
          <div className="md:col-span-1 space-y-4">
            <Mood selectedDate={selectedDate} />

            <Alert>
              <Smile className="h-4 w-4" />
              <AlertDescription>
                Registrar tu estado de ánimo junto con tus entradas del diario te ayuda a mantener un mejor seguimiento de tus emociones y experiencias.
              </AlertDescription>
            </Alert>
          </div>
        </div>
        </div>
      </JournalLockProvider>
    </JournalEntryProvider>
  );
};

export default JournalWithMood;