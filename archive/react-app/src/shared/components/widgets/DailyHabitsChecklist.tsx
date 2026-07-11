import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, Loader2, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { useNavigate } from 'react-router-dom';
import { useHabitDataDaily } from '@/modules/habit/controllers/useHabitDataDaily.supabase';
import { getLocalDateString } from '@/shared/utils/dates';
import { HABITS } from '@/modules/habit/models';
import { cn } from '@/lib/utils';

interface DailyHabitsChecklistProps {
  date: Date;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export const DailyHabitsChecklist: React.FC<DailyHabitsChecklistProps> = ({
  date,
  variant = 'detailed',
  className
}) => {
  const navigate = useNavigate();
  const { completedHabits, status, toggleHabit } = useHabitDataDaily(date);
  const loading = status === 'saving' || status === 'pending';
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const dateStr = getLocalDateString(date);
  
  // Calculate current time of day first
  const currentHour = new Date().getHours();
  const getCurrentTimeOfDay = () => {
    if (currentHour >= 6 && currentHour < 12) return 'morning';
    if (currentHour >= 12 && currentHour < 18) return 'afternoon';
    if (currentHour >= 18 && currentHour < 24) return 'night';
    return 'anytime';
  };
  const currentTimeOfDay = getCurrentTimeOfDay();

  // Initialize expanded sections with current time period
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([currentTimeOfDay])
  );
  
  // Group habits by time of day
  const groupedHabits = HABITS.reduce((groups, habit) => {
    const timeOfDay = habit.timeOfDay || 'anytime';
    if (!groups[timeOfDay]) {
      groups[timeOfDay] = [];
    }
    groups[timeOfDay].push(habit);
    return groups;
  }, {} as Record<string, typeof HABITS>);

  const timeOfDayLabels = {
    morning: '🌅 Mañana',
    afternoon: '☀️ Tarde', 
    night: '🌙 Noche',
    anytime: '⏰ Cualquier momento'
  };

  const timeOfDayOrder = ['morning', 'afternoon', 'night', 'anytime'];

  const toggleSection = (timeOfDay: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(timeOfDay)) {
        newSet.delete(timeOfDay);
      } else {
        newSet.add(timeOfDay);
      }
      return newSet;
    });
  };

  const handleToggle = async (habitId: number) => {
    if (toggleLoading === habitId) return;
    
    setToggleLoading(habitId);
    try {
      await toggleHabit(habitId, dateStr);
    } catch (error) {
      console.error('Error toggling habit:', error);
    } finally {
      setToggleLoading(null);
    }
  };

  const totalHabits = HABITS.length;
  const completedCount = Object.entries(completedHabits).filter(([key, val]) =>
    key.endsWith(`_${dateStr}`) && val
  ).length;
  const percentage = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  return (
    <DailyWidget
      title="Hábitos del Día"
      icon={CheckCircle}
      variant={variant}
      loading={loading}
      className={className}
    >
      <div className="space-y-4">
        {/* Progress Summary */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <div>
            <p className="text-lg font-bold text-green-600">
              {completedCount}/{totalHabits} completados
            </p>
            <p className="text-sm text-gray-600">
              {percentage.toFixed(0)}% del día
            </p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                  className="text-green-500 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Habits by Time of Day */}
        <div className="space-y-3">
          {timeOfDayOrder.map(timeOfDay => {
            const habitsForTime = groupedHabits[timeOfDay] || [];
            if (habitsForTime.length === 0) return null;

            const isCurrentTime = timeOfDay === currentTimeOfDay;
            const isExpanded = expandedSections.has(timeOfDay);
            
            return (
              <div 
                key={timeOfDay}
                className={cn(
                  "border rounded-lg transition-all duration-200",
                  isCurrentTime 
                    ? "border-blue-300 bg-blue-50 shadow-sm" 
                    : "border-gray-200 bg-white"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(timeOfDay)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors rounded-lg",
                    isCurrentTime && "hover:bg-blue-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "text-sm font-medium",
                      isCurrentTime ? "text-blue-700" : "text-gray-700"
                    )}>
                      {timeOfDayLabels[timeOfDay as keyof typeof timeOfDayLabels]}
                    </h4>
                    {isCurrentTime && <Clock className="w-3 h-3 text-blue-500" />}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="space-y-2 px-3 pb-3">
                    {habitsForTime.map(habit => {
                    const habitKey = `${habit.id}_${dateStr}`;
                    const isCompleted = completedHabits[habitKey] || false;
                    const isToggling = toggleLoading === habit.id;
                    
                    return (
                      <div key={habit.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(habit.id);
                          }}
                          disabled={isToggling}
                          className={cn(
                            "flex-1 flex items-center gap-3 p-2 rounded-md transition-all duration-200 text-left",
                            isCompleted 
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100",
                            isToggling && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex-shrink-0">
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          
                          <span className="text-lg mr-2">{habit.icon}</span>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              isCompleted && "line-through"
                            )}>
                              {habit.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {habit.goal}
                            </p>
                          </div>
                        </button>
                        
                        {habit.steps && habit.steps.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/habit/${habit.id}/run`, {
                                state: { date: date.toISOString() }
                              });
                            }}
                            className="flex-shrink-0 p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Iniciar hábito paso a paso"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DailyWidget>
  );
};

export default DailyHabitsChecklist;