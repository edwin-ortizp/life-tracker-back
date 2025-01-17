import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { DiaryHeader } from './DiaryHeader';
import { DiaryInput } from './DiaryInput';
import { useDiaryData } from '../hooks/useDiaryData';
import type { DiaryProps } from '../types';

export const Diary: React.FC<DiaryProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const {
    entry,
    setEntry,
    status,
    error,
    saveEntry
  } = useDiaryData(selectedDate);

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para usar el diario</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <DiaryHeader status={status} />
        <DiaryInput
          value={entry}
          onChange={(value) => {
            setEntry(value);
          }}
          onSave={() => saveEntry(entry)}
          status={status}
        />
        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Diary;