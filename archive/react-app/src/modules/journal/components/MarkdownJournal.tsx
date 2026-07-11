import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useMarkdownWeek } from '../controllers/useMarkdownWeek';

interface MarkdownJournalProps {
  week: string;
}

export const MarkdownJournal: React.FC<MarkdownJournalProps> = ({ week }) => {
  const entries = useMarkdownWeek(week);

  if (!entries) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>No se encontró el archivo del diario.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 p-4">
        {entries.map((entry, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="font-semibold text-lg">{entry.day}</h3>
            <p>{entry.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MarkdownJournal;
