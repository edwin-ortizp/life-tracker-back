import React, { useState } from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { useNavigate } from 'react-router-dom';
import { useHabitDataDaily } from '@/modules/habit/controllers/useHabitDataDaily.supabase';
import { getLocalDateString } from '@/shared/utils/dates';
import { HABITS } from '@/modules/habit/models';
import { paths } from '@/core/routes/paths';

interface QuickAccessHabitsProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessHabits: React.FC<QuickAccessHabitsProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { completedHabits, status, toggleHabit } = useHabitDataDaily(date);
  const loading = status === 'saving' || status === 'pending';
  const [toggleLoading, setToggleLoading] = useState(false);

  const dateStr = getLocalDateString(date);
  const totalHabits = HABITS.length;
  
  const completedCount = Object.entries(completedHabits).filter(([key, val]) =>
    key.endsWith(`_${dateStr}`) && val
  ).length;

  const percentage = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  const getNextIncompleteHabit = () => {
    return HABITS.find(habit => {
      const habitKey = `${habit.id}_${dateStr}`;
      return !completedHabits[habitKey];
    });
  };

  const nextHabit = getNextIncompleteHabit();

  const handleQuickToggle = async () => {
    if (nextHabit && !toggleLoading) {
      setToggleLoading(true);
      try {
        await toggleHabit(nextHabit.id, dateStr);
      } catch (error) {
        console.error('Error toggling habit:', error);
      } finally {
        setToggleLoading(false);
      }
    }
  };

  return (
    <DailyWidget
      title="Hábitos"
      icon={CheckCircle}
      variant={variant}
      loading={loading}
      onClick={() => navigate(paths.habit.view('tracker'))}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-green-600">
              {completedCount}/{totalHabits}
            </p>
            <p className="text-xs text-gray-500">
              {percentage.toFixed(0)}% completado
            </p>
          </div>
          
          {nextHabit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickToggle();
              }}
              disabled={toggleLoading}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 hover:bg-green-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {toggleLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              {variant === 'detailed' ? nextHabit.name : nextHabit.icon}
            </button>
          )}
        </div>
        
        {variant === 'detailed' && (
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            {nextHabit && (
              <p className="text-xs text-gray-600">
                Siguiente: {nextHabit.name}
              </p>
            )}
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessHabits;
