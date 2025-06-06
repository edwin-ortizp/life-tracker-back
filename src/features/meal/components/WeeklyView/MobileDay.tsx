// MobileDay.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Meal, MEAL_TYPES } from '../../types';
import { MEAL_HOURS } from '../../utils/dateUtils';
import { MobileDayProps } from './types';

export const MobileDay: React.FC<MobileDayProps> = ({
  day,
  mealPlan,
  onOpenModal,
}) => {
  // Verificar si el día es del pasado
  const today = new Date();
  const dayDate = new Date(day.fullDate);
  const isToday = dayDate.toDateString() === today.toDateString();
  const isPastDay = dayDate < today && !isToday;
  
  // Días pasados colapsados por defecto
  const [isExpanded, setIsExpanded] = useState(!isPastDay);
  
  // Contar comidas agregadas
  const mealsCount = Object.keys(mealPlan[day.fullDate] || {}).length;
  const totalMeals = Object.keys(MEAL_TYPES).length;
  
  return (
    <div className={`mx-2 my-3 rounded-xl shadow-sm border transition-all duration-200 ${
      isPastDay 
        ? 'bg-gray-50 border-gray-200 opacity-75' 
        : 'bg-white border-gray-100'
    }`}>
      {/* Header del día - clickeable para colapsar días pasados */}
      <div 
        className={`flex justify-between items-center p-4 ${
          isPastDay ? 'cursor-pointer hover:bg-gray-100' : ''
        } ${!isExpanded ? 'rounded-xl' : 'border-b border-gray-100 rounded-t-xl'}`}
        onClick={isPastDay ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-2">
          {isPastDay && (
            <div className="text-gray-400">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          )}
          <h3 className={`font-semibold text-base ${
            isPastDay ? 'text-gray-500' : isToday ? 'text-blue-600' : 'text-gray-900'
          }`}>
            {day.dayName}
            {isToday && ' (Hoy)'}
          </h3>
          {isPastDay && !isExpanded && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
              {mealsCount}/{totalMeals}
            </span>
          )}
        </div>
        <span className={`text-sm px-2 py-1 rounded-md ${
          isPastDay ? 'text-gray-400 bg-gray-100' : 'text-gray-500 bg-gray-50'
        }`}>
          {day.fullDate.split('-').slice(1).join('/')}
        </span>
      </div>      
      {/* Lista de comidas - colapsable para días pasados */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {Object.entries(MEAL_TYPES)
            .sort(([,a], [,b]) => a.order - b.order)
            .map(([type, config]) => {
              const meal = mealPlan[day.fullDate]?.[type as Meal['type']];
              const { color, hoverColor } = config;
              
              return (
                <div key={type} className="flex items-center gap-3">
                  {/* Icono y hora */}
                  <div className="flex flex-col items-center w-12 shrink-0">
                    <config.icon className={`w-5 h-5 mb-1 ${
                      isPastDay ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <span className={`text-xs text-center leading-tight ${
                      isPastDay ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {MEAL_HOURS[type as keyof typeof MEAL_HOURS]}:00
                    </span>
                  </div>
                  
                  {/* Contenido de la comida */}
                  {meal ? (
                    <div
                      className={`flex-1 p-3 rounded-lg transition-all duration-200 cursor-pointer border active:scale-95 ${
                        isPastDay 
                          ? 'bg-gray-100 border-gray-200 hover:bg-gray-150' 
                          : `${color} ${hoverColor} border-gray-200`
                      }`}
                      onClick={() => onOpenModal(day.fullDate, type as Meal['type'], meal)}
                    >
                      <div className={`font-medium text-sm mb-1 line-clamp-1 ${
                        isPastDay ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {meal.name}
                      </div>
                      {meal.notes && (
                        <div className={`text-xs line-clamp-2 mb-2 ${
                          isPastDay ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {meal.notes}
                        </div>
                      )}
                      {meal.recipe && (
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            isPastDay ? 'bg-gray-400' : 'bg-blue-500'
                          }`} />
                          <span className={`text-xs ${
                            isPastDay ? 'text-gray-400' : 'text-blue-600'
                          }`}>
                            Receta
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={isPastDay}
                      className={`flex-1 justify-start border-dashed h-auto py-3 text-sm transition-all ${
                        isPastDay 
                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50 active:scale-95'
                      }`}
                      onClick={() => !isPastDay && onOpenModal(day.fullDate, type as Meal['type'])}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="truncate">
                        {isPastDay ? 'No agregado' : `Agregar ${config.title.toLowerCase()}`}
                      </span>
                    </Button>
                  )}
                </div>
              );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileDay;