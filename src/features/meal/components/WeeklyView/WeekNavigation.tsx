// WeekNavigation.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthYear } from '../../utils/dateUtils.ts';

interface WeekNavigationProps {
  currentDate: Date;
  onNavigateWeek: (direction: 'next' | 'prev') => void;
  onGoToToday: () => void;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({
  currentDate,
  onNavigateWeek,
  onGoToToday,
}) => {
  return (
    <div className="sticky top-0 bg-white border-b p-4 z-20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigateWeek('prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigateWeek('next')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <h2 className="text-lg font-medium">
          {formatMonthYear(currentDate)}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onGoToToday}
          className="whitespace-nowrap"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Hoy
        </Button>
      </div>
    </div>
  );
};

export default WeekNavigation;