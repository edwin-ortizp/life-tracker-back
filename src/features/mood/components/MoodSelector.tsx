import React from 'react';
import { Button } from '@/components/ui/button';
import { useMoodStates } from '../hooks/useMoodStates';

interface MoodSelectorProps {
  onSelect: (mood: { emoji: string; text: string }) => void;
  disabled?: boolean;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ onSelect, disabled }) => {
  const { moodStates } = useMoodStates();

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {moodStates.map((mood) => (
        <div key={mood.emoji} className="relative">
          <Button
            variant="outline"
            onClick={() => onSelect(mood)}
            className="h-12 text-lg w-full relative" // Removed hover:bg-gray-100
            disabled={disabled}
          >
            <span>{mood.emoji}</span>
            <span className="w-full text-center text-xs text-gray-500 mt-1">
          {mood.text}
          </span>
          </Button>
          
        </div>
      ))}
    </div>
  );
};