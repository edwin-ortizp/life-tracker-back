// src/features/mood/components/MoodHistory.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditMoodModal } from './EditMoodModal';
import type { MoodEntry } from '../types';

interface MoodHistoryProps {
  moods: MoodEntry[];
  onUpdateMood: (originalTimestamp: number, updatedMood: MoodEntry) => Promise<void>;
  onDeleteMood: (timestamp: number) => Promise<void>;
}

export const MoodHistory: React.FC<MoodHistoryProps> = ({ 
  moods,
  onUpdateMood,
  onDeleteMood
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodEntry | null>(null);

  // Ordenar los estados de ánimo por timestamp de más reciente a más antiguo
  const sortedMoods = [...moods].sort((a, b) => b.timestamp - a.timestamp);
  const displayMoods = isExpanded ? sortedMoods : sortedMoods.slice(0, 3);
  const hasMoreMoods = moods.length > 3;

  const handleEdit = (mood: MoodEntry) => {
    setSelectedMood(mood);
  };

  const handleUpdate = async (updatedMood: MoodEntry) => {
    if (!selectedMood) return;
    await onUpdateMood(selectedMood.timestamp, updatedMood);
  };

  const handleDelete = async () => {
    if (!selectedMood) return;
    await onDeleteMood(selectedMood.timestamp);
  };

  return (
    <>
      <div className="mt-4 space-y-2">
        {displayMoods.map((entry, index) => (
          <div 
            key={`${entry.timestamp}_${index}`}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
          >
            <span className="text-xl">{entry.emoji}</span>
            <span>{entry.text}</span>
            <span className="text-gray-500 ml-auto">{entry.time}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0"
              onClick={() => handleEdit(entry)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {hasMoreMoods && (
          <Button
            variant="ghost"
            className="w-full h-8 text-sm text-gray-500 hover:text-gray-900"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <span className="flex items-center gap-1">
                Ver menos <ChevronUp className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Ver más ({moods.length - 3}) <ChevronDown className="h-4 w-4" />
              </span>
            )}
          </Button>
        )}

        {moods.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No hay registros para este día
          </div>
        )}
      </div>

      <EditMoodModal 
        isOpen={selectedMood !== null}
        onClose={() => setSelectedMood(null)}
        moodEntry={selectedMood}
        onSave={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
};