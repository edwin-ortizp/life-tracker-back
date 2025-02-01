// src/features/negative-habits/components/AddHabitModal/HabitGrid.tsx
import React, { useState } from 'react';
import { NEGATIVE_HABIT_CATEGORIES, NEGATIVE_HABITS, NegativeHabitCategory } from '../../types/index';
import { CategorySection } from './CategorySection';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface HabitGridProps {
  onSelectHabit: (habitId: number, note?: string) => Promise<void>;
}

export const HabitGrid: React.FC<HabitGridProps> = ({ onSelectHabit }) => {
  const [selectedCategory, setSelectedCategory] = useState<NegativeHabitCategory>('health');

  // Agrupar hábitos por categoría
  const habitsByCategory = NEGATIVE_HABITS.reduce((acc, habit) => {
    if (!acc[habit.category]) {
      acc[habit.category] = [];
    }
    acc[habit.category].push(habit);
    return acc;
  }, {} as Record<NegativeHabitCategory, typeof NEGATIVE_HABITS>);

  return (
    <div className="w-full">
      <Tabs 
        defaultValue={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value as NegativeHabitCategory)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 gap-2 h-auto sm:grid-cols-7">
          {Object.entries(NEGATIVE_HABIT_CATEGORIES).map(([category, { icon, label }]) => (
            <TabsTrigger
              key={category}
              value={category}
              className="text-sm flex flex-col gap-1 py-2 h-auto"
            >
              <span className="text-xl">{icon}</span>
              <span className="hidden sm:inline text-xs">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(habitsByCategory).map(([category, habits]) => (
          <TabsContent 
            key={category} 
            value={category}
            className="mt-4"
          >
            <CategorySection
              category={category as NegativeHabitCategory}
              habits={habits}
              onSelectHabit={onSelectHabit}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};