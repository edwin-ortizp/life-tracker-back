// MobileDay.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Meal, MEAL_TYPES } from '../../types';
import { MEAL_HOURS } from '../../utils/dateUtils';
import { MobileDayProps } from './types';

export const MobileDay: React.FC<MobileDayProps> = ({
  day,
  mealPlan,
  onOpenModal,
}) => {
  return (
    <div className="bg-white mx-2 my-3 p-4 rounded-xl shadow-sm border border-gray-100">
      {/* Header del día */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-base">{day.dayName}</h3>
        <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
          {day.fullDate.split('-').slice(1).join('/')}
        </span>
      </div>
      
      {/* Lista de comidas */}
      <div className="space-y-3">
        {Object.entries(MEAL_TYPES)
          .sort(([,a], [,b]) => a.order - b.order)
          .map(([type, config]) => {
            const meal = mealPlan[day.fullDate]?.[type as Meal['type']];
            const { color, hoverColor } = config;
            
            return (
              <div key={type} className="flex items-center gap-3">
                {/* Icono y hora */}
                <div className="flex flex-col items-center w-12 shrink-0">
                  <config.icon className="w-5 h-5 text-gray-600 mb-1" />
                  <span className="text-xs text-gray-500 text-center leading-tight">
                    {MEAL_HOURS[type as keyof typeof MEAL_HOURS]}:00
                  </span>
                </div>
                
                {/* Contenido de la comida */}
                {meal ? (
                  <div
                    className={`flex-1 p-3 rounded-lg transition-all duration-200 ${color} ${hoverColor} cursor-pointer border border-gray-200 active:scale-95`}
                    onClick={() => onOpenModal(day.fullDate, type as Meal['type'], meal)}
                  >
                    <div className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{meal.name}</div>
                    {meal.notes && (
                      <div className="text-xs text-gray-600 line-clamp-2 mb-2">{meal.notes}</div>
                    )}
                    {meal.recipe && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-xs text-blue-600">Receta</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1 justify-start border-dashed border-gray-300 h-auto py-3 text-sm text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                    onClick={() => onOpenModal(day.fullDate, type as Meal['type'])}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="truncate">Agregar {config.title.toLowerCase()}</span>
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