// src/features/mood/components/MoodSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { MOODS } from '../types';

interface MoodSelectorProps {
  onSelect: (mood: { emoji: string; text: string }) => void;
  disabled?: boolean;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({ onSelect, disabled }) => {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {MOODS.map((mood) => (
        <Button
          key={mood.emoji}
          variant="outline"
          onClick={() => onSelect(mood)}
          className="h-12 text-lg"
          disabled={disabled}
        >
          {mood.emoji}
        </Button>
      ))}
    </div>
  );
};