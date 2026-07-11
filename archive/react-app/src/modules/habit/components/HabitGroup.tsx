import React, { useState } from 'react';
import { Sun, Coffee, Moon, Flame, Trophy } from 'lucide-react'; // ChevronDown removed
import { HABITS, Habit } from '../models';
import { getWeekDays } from '@/modules/habit/utils/dateUtils';
import { getLocalDateString } from '@/shared/utils/dates';
import { Progress } from '@/shared/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";

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

  // toggleSection removed as Accordion handles it via onValueChange

  return (
    <Accordion
      type="multiple"
      value={openSections}
      onValueChange={setOpenSections}
      className="w-full space-y-4"
    >
      {Object.entries(groupedHabits).map(([timeOfDay, habits]) => {
        const config = TIMEOFDAY_CONFIG[timeOfDay as keyof typeof TIMEOFDAY_CONFIG];
        const Icon = config.icon;
        // isOpen variable removed
        const progress = getProgress(habits);
        const streak = calculateStreak(habits, completedHabits);
        const completionRate = progress.daily.completed / progress.daily.total;
        
        return (
          <AccordionItem
            value={timeOfDay}
            key={timeOfDay}
            className="rounded-lg border border-gray-200 overflow-hidden"
          >
            <AccordionTrigger
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring data-[state=closed]:rounded-b-lg data-[state=open]:border-b"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-medium">{config.title}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Hoy: {progress.daily.completed}/{progress.daily.total}
                  </span>
                  <span className="text-sm text-gray-500">
                    Semana: {progress.weekly.completed}/{progress.weekly.total}
                  </span>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Flame className="w-4 h-4" />
                      <span className="text-sm">{streak}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* ChevronDown icon is automatically handled by AccordionTrigger */}
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4">
              {/* Removed conditional rendering based on isOpen */}
              <div className="space-y-6">
                {children(habits)}

                <div className="pt-2 space-y-3 border-t border-gray-100">
                  <Progress
                    value={(progress.daily.completed / progress.daily.total) * 100}
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {getMotivationalMessage(completionRate)}
                    </span>
                    {progress.daily.completed === progress.daily.total && (
                      <div className="flex items-center gap-1 text-green-500">
                        <Trophy className="w-4 h-4" />
                        <span>¡Completado!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};