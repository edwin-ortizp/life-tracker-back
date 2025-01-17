// src/features/mood/components/MoodHistory.tsx
import React from 'react';
import type { Mood } from '../types';

interface MoodHistoryProps {
  moods: Mood[];
}

export const MoodHistory: React.FC<MoodHistoryProps> = ({ moods }) => {
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {moods.length > 0 ? (
        moods.map((entry) => (
          <div 
            key={entry.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded"
          >
            <span className="text-xl">{entry.emoji}</span>
            <span>{entry.text}</span>
            <span className="text-gray-500 ml-auto">{entry.time}</span>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-4">
          No hay registros para este día
        </div>
      )}
    </div>
  );
};