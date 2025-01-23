// MobileDay.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Meal, MEAL_TYPES } from '../../types';
import { MobileDayProps } from './types';

export const MobileDay: React.FC<MobileDayProps> = ({
  day,
  mealPlan,
  onOpenModal,
}) => {
  return (
    <div className="space-y-4 p-4 border-b last:border-b-0">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{day.dayName}</h3>
        <span className="text-sm text-gray-500">
          {day.fullDate.split('-').slice(1).join('/')}
        </span>
      </div>
      
      <div className="space-y-3">
        {Object.entries(MEAL_TYPES)
          .sort(([,a], [,b]) => a.order - b.order)
          .map(([type, config]) => {
            const meal = mealPlan[day.fullDate]?.[type as Meal['type']];
            const { color, hoverColor } = config;
            
            return (
              <div key={type} className="flex items-center gap-3">
                <config.icon className="w-5 h-5 text-gray-600 shrink-0" />
                {meal ? (
                  <div 
                    className={`flex-1 p-2 rounded transition-colors duration-200 ${color} ${hoverColor} cursor-pointer`}
                    onClick={() => onOpenModal(day.fullDate, type as Meal['type'], meal)}
                  >
                    <div className="font-medium line-clamp-1">{meal.name}</div>
                    {meal.notes && (
                      <div className="text-sm text-gray-600 line-clamp-1">{meal.notes}</div>
                    )}
                    {meal.recipe && (
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1 justify-start border-dashed"
                    onClick={() => onOpenModal(day.fullDate, type as Meal['type'])}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar {config.title.toLowerCase()}
                  </Button>
                )}
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default MobileDay;