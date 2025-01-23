// DesktopDay.tsx
import React from 'react';
import { Meal, MEAL_TYPES, MealPlan } from '../../types';
import MealCell from './MealCell';

interface DesktopDayProps {
  day: {
    dayName: string;
    fullDate: string;
    isCurrentMonth: boolean;
  };
  mealPlan: MealPlan;
  disabled?: boolean;
  onOpenModal: (date: string, type: Meal['type'], meal?: Meal) => void;
}

export const DesktopDay: React.FC<DesktopDayProps> = ({
  day,
  mealPlan,
  disabled,
  onOpenModal,
}) => {
  return (
    <div className={`px-2 ${!day.isCurrentMonth ? 'bg-gray-50' : ''}`}>
      <div className="text-center py-2 border-b">
        <div className="font-medium">{day.dayName}</div>
        <div className="text-xs text-gray-500">
          {day.fullDate.split('-').slice(1).join('/')}
        </div>
      </div>

      {Object.entries(MEAL_TYPES)
        .sort(([,a], [,b]) => a.order - b.order)
        .map(([type]) => (
          <div key={type} className="h-32 py-2">
            <MealCell
              date={day.fullDate}
              type={type as Meal['type']}
              meal={mealPlan[day.fullDate]?.[type as Meal['type']]}
              disabled={disabled}
              onOpenModal={onOpenModal}
            />
          </div>
        ))}
    </div>
  );
};

export default DesktopDay;