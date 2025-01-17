import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DateSelector = ({ selectedDate, onChange }) => {
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

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousDay}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextDay}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 text-center">
        <h2 className="text-lg font-medium">{formatDate(selectedDate)}</h2>
        {!isToday(selectedDate) && (
          <Button
            variant="link"
            className="text-sm"
            onClick={goToToday}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Ir a hoy
          </Button>
        )}
      </div>
    </div>
  );
};

export default DateSelector;