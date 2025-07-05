import React from 'react';
import { Dumbbell, Plus } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDailySummary } from '@/features/statistics/hooks/useDailySummary';

interface QuickAccessExerciseProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessExercise: React.FC<QuickAccessExerciseProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { summary, loading } = useDailySummary(date);

  const exerciseCalories = summary.exercise.calories;
  const exerciseMinutes = summary.exercise.minutes;
  const dailyGoal = 500; // 500 calories goal
  const percentage = Math.min((exerciseCalories / dailyGoal) * 100, 100);

  const handleAddExercise = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/exercise');
  };

  return (
    <DailyWidget
      title="Ejercicio"
      icon={Dumbbell}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/exercise')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-green-600">
              {exerciseCalories} cal
            </p>
            <p className="text-xs text-gray-500">
              de {dailyGoal} cal ({percentage.toFixed(0)}%) - {exerciseMinutes}min
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExercise}
            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 border-green-200"
          >
            <Plus className="w-3 h-3" />
            {variant === 'detailed' && 'Registrar'}
          </Button>
        </div>
        
        {variant === 'detailed' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessExercise;