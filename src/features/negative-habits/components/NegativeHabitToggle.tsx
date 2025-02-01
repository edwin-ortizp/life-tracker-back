// src/features/negative-habits/components/NegativeHabitToggle.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, BarChart3 } from 'lucide-react';

interface NegativeHabitToggleProps {
  view: 'weekly' | 'yearly';
  onViewChange: (view: 'weekly' | 'yearly') => void;
}

export const NegativeHabitToggle: React.FC<NegativeHabitToggleProps> = ({
  view,
  onViewChange
}) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant={view === 'weekly' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onViewChange('weekly')}
        className="gap-2"
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">Semanal</span>
      </Button>
      <Button 
        variant={view === 'yearly' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onViewChange('yearly')}
        className="gap-2"
      >
        <BarChart3 className="w-4 h-4" />
        <span className="hidden sm:inline">Anual</span>
      </Button>
    </div>
  );
};