import React, { useState } from 'react';
import { Sun, Coffee, Moon, ChevronDown, Flame, Trophy } from 'lucide-react';
import { HABITS, Habit } from '../types';
import { getWeekDays } from '../utils/dateUtils';
import { getLocalDateString } from '@/utils/dates';
import { Progress } from '@/components/ui/progress';

interface HabitGroupProps {
  children: (habits: Habit[]) => React.ReactNode;
  completedHabits: { [key: string]: boolean };
}

const TIMEOFDAY_CONFIG = {
  morning: {
    icon: Sun,
    title: 'Mañana',
    defaultOpen: () => {
      const hour = new Date().getHours();
      return hour >= 5 && hour < 12;
    }
  },
  afternoon: {
    icon: Coffee,
    title: 'Tarde',
    defaultOpen: () => {
      const hour = new Date().getHours();
      return hour >= 12 && hour < 18;
    }
  },
  night: {
    icon: Moon,
    title: 'Noche',
    defaultOpen: () => {
      const hour = new Date().getHours();
      return hour >= 18 || hour < 5;
    }
  },
  anytime: {
    icon: Coffee,
    title: 'Cualquier momento',
    defaultOpen: () => false
  }
};

const getMotivationalMessage = (completionRate: number) => {
  if (completionRate >= 0.9) return "¡Increíble! ¡Sigue así! 🌟";
  if (completionRate >= 0.7) return "¡Vas muy bien! ¡No pares! 💪";
  if (completionRate >= 0.5) return "¡Buen progreso! ¡Sigue adelante! 🎯";
  if (completionRate >= 0.3) return "¡Cada pequeño paso cuenta! 🌱";
  return "¡Hoy es un buen día para empezar! 🚀";
};

const calculateStreak = (habits: Habit[], completedHabits: { [key: string]: boolean }) => {
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 30; i++) { // Check last 30 days
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = getLocalDateString(date);
    
    const hasCompletedAll = habits.every(habit => 
      completedHabits[`${habit.id}_${dateStr}`]
    );
    
    if (hasCompletedAll) {
      streak++;
    } else if (i < 7) { // Only count consecutive days in the last week
      break;
    }
  }
  
  return streak;
};

export const HabitGroup: React.FC<HabitGroupProps> = ({ children, completedHabits }) => {
  const [openSections, setOpenSections] = useState<string[]>(() => {
    return Object.entries(TIMEOFDAY_CONFIG)
      .filter(([_, config]) => config.defaultOpen())
      .map(([key]) => key);
  });

  const groupedHabits = React.useMemo(() => {
    return HABITS.reduce((acc, habit) => {
      if (!acc[habit.timeOfDay]) {
        acc[habit.timeOfDay] = [];
      }
      acc[habit.timeOfDay].push(habit);
      return acc;
    }, {} as Record<string, Habit[]>);
  }, []);

  const getProgress = (habits: Habit[]) => {
    const weekDays = getWeekDays();
    const today = getLocalDateString();
    
    // Daily progress
    const completedToday = habits.filter(habit => 
      completedHabits[`${habit.id}_${today}`]
    ).length;
    
    // Weekly progress
    let totalCompletedWeek = 0;
    const totalPossibleWeek = habits.length * weekDays.length;

    weekDays.forEach(day => {
      habits.forEach(habit => {
        if (completedHabits[`${habit.id}_${day.fullDate}`]) {
          totalCompletedWeek++;
        }
      });
    });

    return {
      daily: { completed: completedToday, total: habits.length },
      weekly: { completed: totalCompletedWeek, total: totalPossibleWeek }
    };
  };

  const toggleSection = (timeOfDay: string) => {
    setOpenSections(prev => 
      prev.includes(timeOfDay)
        ? prev.filter(section => section !== timeOfDay)
        : [...prev, timeOfDay]
    );
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedHabits).map(([timeOfDay, habits]) => {
        const config = TIMEOFDAY_CONFIG[timeOfDay as keyof typeof TIMEOFDAY_CONFIG];
        const Icon = config.icon;
        const isOpen = openSections.includes(timeOfDay);
        const progress = getProgress(habits);
        const streak = calculateStreak(habits, completedHabits);
        const completionRate = progress.daily.completed / progress.daily.total;
        
        return (
          <div key={timeOfDay} className="rounded-lg border border-gray-200">
            {/* Header del grupo de hábitos */}
            <button
              onClick={() => toggleSection(timeOfDay)}
              className="w-full p-4 text-left hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                {/* Título y botón - siempre en la primera línea */}
                <div className="flex items-center justify-between md:justify-start md:flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{config.title}</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform md:hidden ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Métricas - segunda línea en móvil, misma línea en desktop */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      Hoy: {progress.daily.completed}/{progress.daily.total}
                    </span>
                    <span className="hidden md:inline text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      Semana: {progress.weekly.completed}/{progress.weekly.total}
                    </span>
                  </div>
                  
                  {streak > 0 && (
                    <>
                      <span className="hidden md:inline text-gray-300">•</span>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Flame className="w-4 h-4 shrink-0" />
                        <span>{streak} días</span>
                      </div>
                    </>
                  )}
                  
                  <ChevronDown 
                    className={`hidden md:block w-4 h-4 transition-transform shrink-0 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
            </button>
            
            {/* Contenido del grupo de hábitos */}
            <div
              className={`transition-all duration-200 ease-in-out overflow-hidden ${
                isOpen ? 'px-4 md:px-6 py-4 max-h-[2000px]' : 'max-h-0 py-0'
              }`}
            >
              {isOpen && (
                <div className="space-y-6">
                  {/* Lista de hábitos */}
                  <div className="space-y-2">
                    {children(habits)}
                  </div>
                  
                  {/* Barra de progreso y mensajes */}
                  <div className="pt-4 space-y-3 border-t border-gray-100">
                    <Progress 
                      value={(progress.daily.completed / progress.daily.total) * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm text-gray-600">
                        {getMotivationalMessage(completionRate)}
                      </span>
                      {progress.daily.completed === progress.daily.total && (
                        <div className="flex items-center gap-1 text-green-500 text-sm">
                          <Trophy className="w-4 h-4 shrink-0" />
                          <span>¡Completado!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};