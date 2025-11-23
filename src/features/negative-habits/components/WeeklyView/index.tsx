// src/features/negative-habits/components/WeeklyView/index.tsx
import React, { useState, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WeeklyHabitList } from './WeeklyHabitList';
import { WeeklyViewProps } from '../../types';
import { NEGATIVE_HABITS, NEGATIVE_HABIT_CATEGORIES, NegativeHabit } from '../../types';
import { getWeekDays } from '@/utils/dates';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

// Componente principal para la vista semanal de hábitos negativos
export const WeeklyView: React.FC<WeeklyViewProps> = ({
  habits,
  onLogHabit,
  onRemoveLog,
  disabled
}) => {
  const weekDays = getWeekDays(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['health']); // Comenzar con 'salud' expandido
  const [showAllHabits, setShowAllHabits] = useState(false);
  // Agrupar hábitos por categoría
  const habitGroups = useMemo(() => {
    const groups: { [key: string]: NegativeHabit[] } = {};
    
    NEGATIVE_HABITS.forEach(habit => {
      if (!groups[habit.category]) {
        groups[habit.category] = [];
      }
      // Filtrar por término de búsqueda
      if (searchTerm && !habit.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }
      groups[habit.category].push(habit);
    });

    return groups;
  }, [searchTerm]);

  // Calcular estadísticas de hábitos
  const habitStats = useMemo(() => {
    const totalHabits = NEGATIVE_HABITS.length;
    const filteredHabits = Object.values(habitGroups).reduce((sum, habits) => sum + habits.length, 0);
    
    // Contar hábitos loggeados por categoría
    const loggedByCategory: { [key: string]: number } = {};
    const today = new Date().toISOString().split('T')[0];
    
    Object.entries(habits).forEach(([key]) => {
      const [habitIdStr, date] = key.split('_');
      if (date === today) {
        const habit = NEGATIVE_HABITS.find(h => h.id === Number(habitIdStr));
        if (habit) {
          loggedByCategory[habit.category] = (loggedByCategory[habit.category] || 0) + 1;
        }
      }
    });

    return {
      totalHabits,
      filteredHabits,
      loggedByCategory,
      isFiltered: searchTerm.length > 0
    };
  }, [habitGroups, habits, searchTerm]);

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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="space-y-4">      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar hábito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-16"
          />
          {habitStats.isFiltered && (
            <div className="absolute right-2 top-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-xs font-medium">
              {habitStats.filteredHabits}/{habitStats.totalHabits}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowAllHabits(!showAllHabits)}
            className="flex-1 sm:flex-none"
          >
            {showAllHabits ? 'Mostrar más frecuentes' : 'Mostrar todos'}
          </Button>
          {Object.keys(habitStats.loggedByCategory).length > 0 && (
            <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded-md text-sm font-medium">
              {Object.values(habitStats.loggedByCategory).reduce((sum, count) => sum + count, 0)} hoy
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="sm:min-w-[640px]">
          {!showAllHabits ? (
            // Vista de hábitos frecuentes
            <WeeklyHabitList
              habits={frequentHabits}
              completedHabits={habits}
              weekDays={weekDays}
              onLogHabit={onLogHabit}
              onRemoveLog={onRemoveLog}
              disabled={disabled}
            />
          ) : (
            // Vista de todos los hábitos agrupados
            <div className="space-y-6">
              {Object.entries(habitGroups).map(([category, categoryHabits]) => {
                if (categoryHabits.length === 0) return null;
                const isExpanded = expandedCategories.includes(category);
                const categoryInfo = NEGATIVE_HABIT_CATEGORIES[category as keyof typeof NEGATIVE_HABIT_CATEGORIES];

                return (                  <div key={category} className="space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-2" // Removed hover:bg-gray-100
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{categoryInfo.icon}</span>
                        <span className="font-medium">{categoryInfo.label}</span>
                        <span className="text-sm text-gray-500">
                          ({categoryHabits.length})
                        </span>
                        {habitStats.loggedByCategory[category] && (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium ml-1">
                            {habitStats.loggedByCategory[category]} hoy
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </Button>

                    {isExpanded && (
                      <WeeklyHabitList
                        habits={categoryHabits}
                        completedHabits={habits}
                        weekDays={weekDays}
                        onLogHabit={onLogHabit}
                        onRemoveLog={onRemoveLog}
                        disabled={disabled}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>      <Alert variant="destructive"> {/* Removed bg-red-50 */}
        <AlertDescription>
          {showAllHabits 
            ? `Visualización completa de hábitos agrupados por categoría${habitStats.isFiltered ? ` (${habitStats.filteredHabits} de ${habitStats.totalHabits} hábitos mostrados)` : ''}. Usa el buscador para encontrar hábitos específicos.`
            : `Mostrando solo tus ${frequentHabits.length} hábitos más frecuentes. Haz clic en "Mostrar todos" para ver la lista completa.`}
        </AlertDescription>
      </Alert>
    </div>
  );
};