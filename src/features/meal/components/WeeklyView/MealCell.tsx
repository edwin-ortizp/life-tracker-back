// MealCell.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2 } from 'lucide-react';
import { Meal, MEAL_TYPES } from '../../types';

interface MealCellProps {
  date: string;
  type: Meal['type'];
  meal?: Meal;
  disabled?: boolean;
  onOpenModal: (date: string, type: Meal['type'], meal?: Meal) => void;
}

export const MealCell: React.FC<MealCellProps> = ({
  date,
  type,
  meal,
  disabled,
  onOpenModal,
}) => {
  const { color, hoverColor } = MEAL_TYPES[type];

  if (!meal) {
    return (
      <Button
        variant="outline"
        className="w-full h-full border-dashed"
        onClick={() => onOpenModal(date, type)}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div 
      className={`h-full p-2 rounded ${color} relative group cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md`}
      onClick={() => onOpenModal(date, type, meal)}
    >
      <p className="text-sm font-medium line-clamp-2">{meal.name}</p>
      {meal.notes && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{meal.notes}</p>
      )}
      {meal.recipe && (
        <div className="absolute bottom-1 right-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        </div>
      )}
      <div className={`absolute inset-0 flex items-center justify-center 
        bg-white/50 opacity-0 group-hover:opacity-100 rounded transition-opacity ${hoverColor}`}>
        <Edit2 className="h-4 w-4 text-gray-700" />
      </div>
    </div>
  );
};

export default MealCell;