// src/features/negative-habits/components/AddHabitModal/CategorySection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { NegativeHabit, NegativeHabitCategory, NEGATIVE_HABIT_CATEGORIES } from '../../types/index';
import { ScrollArea } from "@/components/ui/scroll-area";

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

      <ScrollArea className="h-[300px] pr-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {habits.map(habit => (
            <Button
              key={habit.id}
              variant="outline"
              className="h-auto py-3 px-2 flex flex-col items-center gap-2 group" // Removed hover:bg-gray-50
              onClick={() => onSelectHabit(habit.id)}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {habit.icon}
              </span>
              <span className="text-xs text-center line-clamp-2">
                {habit.name}
              </span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};