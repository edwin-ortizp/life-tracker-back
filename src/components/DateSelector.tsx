//import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onChange }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
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
  };  const formatDate = (date: Date) => {
    // Formato más compacto para móviles
    if (isMobile) {
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    
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
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm md:p-6 md:mb-8">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
            className="rounded-full border-2 bg-white/80 w-8 h-8 md:w-10 md:h-10"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            className="rounded-full border-2 bg-white/80 w-8 h-8 md:w-10 md:h-10"
          >
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
        
        <div className="flex-1 text-center">
          <h2 className="text-sm md:text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent capitalize">
            {formatDate(selectedDate)}
          </h2>
          {!isToday(selectedDate) && (
            <Button
              variant="ghost"
              className="text-xs md:text-sm mt-1 md:mt-2 rounded-full h-6 md:h-auto px-2 md:px-4"
              onClick={goToToday}
            >
              <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Ir a hoy</span>
              <span className="md:hidden">Hoy</span>
            </Button>
          )}
        </div>
        
        <div className="w-12 md:w-20"> {/* Spacer for balance */}
          {isToday(selectedDate) && (
            <div className="inline-flex items-center px-2 md:px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
              Hoy
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateSelector;