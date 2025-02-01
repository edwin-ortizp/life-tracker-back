// src/features/negative-habits/components/AddHabitModal/CategorySection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { NegativeHabit, NegativeHabitCategory, NEGATIVE_HABIT_CATEGORIES } from '../../types/index';

interface CategorySectionProps {
  category: NegativeHabitCategory;
  habits: NegativeHabit[];
  onSelectHabit: (habitId: number, note?: string) => Promise<void>;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  habits,
  onSelectHabit
}) => {
  const categoryInfo = NEGATIVE_HABIT_CATEGORIES[category];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{categoryInfo.icon}</span>
        <div>
          <h3 className="font-medium">{categoryInfo.label}</h3>
          <p className="text-sm text-gray-500">{categoryInfo.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {habits.map(habit => (
          <Button
            key={habit.id}
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-gray-50"
            onClick={() => onSelectHabit(habit.id)}
          >
            <span className="text-2xl">{habit.icon}</span>
            <span className="text-sm text-center">{habit.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};