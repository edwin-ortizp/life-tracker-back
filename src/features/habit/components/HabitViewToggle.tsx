// src/features/habit/components/HabitViewToggle.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, BarChart3 } from 'lucide-react';

interface HabitViewToggleProps {
  view: 'weekly' | 'graph';
  onViewChange: (view: 'weekly' | 'graph') => void;
}

export const HabitViewToggle: React.FC<HabitViewToggleProps> = ({
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
        variant={view === 'graph' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => onViewChange('graph')}
        className="gap-2"
      >
        <BarChart3 className="w-4 h-4" />
        <span className="hidden sm:inline">Anual</span>
      </Button>
    </div>
  );
};