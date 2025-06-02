//import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onChange }) => {
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onChange(newDate);
  };

  const goToToday = () => {
    onChange(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };

  return (
    <div className="glass-card p-6 mb-8 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
            className="rounded-full border-2 bg-white/80"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            className="rounded-full border-2 bg-white/80"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 text-center">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent capitalize">
            {formatDate(selectedDate)}
          </h2>
          {!isToday(selectedDate) && (            <Button
              variant="ghost"
              className="text-sm mt-2 rounded-full"
              onClick={goToToday}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ir a hoy
            </Button>
          )}
        </div>
        
        <div className="w-20"> {/* Spacer for balance */}
          {isToday(selectedDate) && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
              Hoy
            </div>
          )}        </div>
      </div>
    </div>
  );
};

export default DateSelector;