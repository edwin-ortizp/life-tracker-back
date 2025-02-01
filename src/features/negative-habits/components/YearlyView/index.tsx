// src/features/negative-habits/components/YearlyView/index.tsx
import React, { useState, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { YearlyHabitList } from './YearlyHabitList';
import { YearlyViewProps } from '../../types';
import { NEGATIVE_HABITS, NEGATIVE_HABIT_CATEGORIES, NegativeHabitCategory, NegativeHabit } from '../../types';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const YearlyView: React.FC<YearlyViewProps> = ({
  habits,
  onLogHabit,
  onRemoveLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['health']);
  const [showAllHabits, setShowAllHabits] = useState(false);

  // Obtener hábitos más frecuentes
  const frequentHabits = useMemo(() => {
    const habitCounts = new Map<number, number>();
    
    Object.entries(habits).forEach(([key]) => {
      const [habitId] = key.split('_');
      const count = habitCounts.get(Number(habitId)) || 0;
      habitCounts.set(Number(habitId), count + 1);
    });

    return NEGATIVE_HABITS
      .filter(habit => habitCounts.has(habit.id))
      .sort((a, b) => (habitCounts.get(b.id) || 0) - (habitCounts.get(a.id) || 0))
      .slice(0, 5);
  }, [habits]);

  // Filtrar y agrupar hábitos
  const filteredAndGroupedHabits = useMemo(() => {
    const groups = {} as Record<NegativeHabitCategory, NegativeHabit[]>;
    
    NEGATIVE_HABITS.forEach(habit => {
      if (searchTerm && !habit.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }
      
      if (selectedCategory !== 'all' && habit.category !== selectedCategory) {
        return;
      }

      if (!groups[habit.category]) {
        groups[habit.category] = [];
      }
      
      groups[habit.category].push(habit);
    });

    return groups;
  }, [searchTerm, selectedCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar hábito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {(Object.keys(NEGATIVE_HABIT_CATEGORIES) as NegativeHabitCategory[]).map((category) => (
              <SelectItem key={category} value={category}>
                {NEGATIVE_HABIT_CATEGORIES[category].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setShowAllHabits(!showAllHabits)}
          className="whitespace-nowrap"
        >
          {showAllHabits ? 'Ver frecuentes' : 'Ver todos'}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px] pb-4">
          {!showAllHabits ? (
            <YearlyHabitList
              habits={frequentHabits}
              completedHabits={habits}
              onLogHabit={onLogHabit}
              onRemoveLog={onRemoveLog}
            />
          ) : (
            <div className="space-y-8">
              {(Object.entries(filteredAndGroupedHabits) as [NegativeHabitCategory, NegativeHabit[]][]).map(([category, categoryHabits]) => {
                if (categoryHabits.length === 0) return null;
                const isExpanded = expandedCategories.includes(category);
                const categoryInfo = NEGATIVE_HABIT_CATEGORIES[category];

                return (
                  <div key={category} className="space-y-4">
                    <Button
                      variant="ghost"
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{categoryInfo.icon}</span>
                        <span className="font-medium">{categoryInfo.label}</span>
                        <span className="text-sm text-gray-500">
                          ({categoryHabits.length})
                        </span>
                      </div>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </Button>

                    {isExpanded && (
                      <YearlyHabitList
                        habits={categoryHabits}
                        completedHabits={habits}
                        onLogHabit={onLogHabit}
                        onRemoveLog={onRemoveLog}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Alert variant="destructive" className="bg-red-50">
        <AlertDescription>
          {showAllHabits 
            ? 'Vista completa de hábitos por categoría. Usa los filtros para encontrar hábitos específicos.'
            : 'Mostrando tus hábitos más frecuentes. Cambia a "Ver todos" para la lista completa.'}
        </AlertDescription>
      </Alert>
    </div>
  );
};