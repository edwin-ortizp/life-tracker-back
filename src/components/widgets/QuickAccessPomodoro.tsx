import React from 'react';
import { Timer, Play } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDailySummary } from '@/features/statistics/hooks/useDailySummary';

interface QuickAccessPomodoroProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessPomodoro: React.FC<QuickAccessPomodoroProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { summary, loading } = useDailySummary(date);

  const pomodoroData = summary.pomodoro;
  const minutesWorked = pomodoroData.workMinutes;
  const dailyGoal = 300; // 5 hours daily goal
  const completionRate = Math.min((minutesWorked / dailyGoal) * 100, 100);
  
  // Convert minutes to hours and minutes for display
  const hours = Math.floor(minutesWorked / 60);
  const minutes = minutesWorked % 60;
  const timeDisplay = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

  const handleStartPomodoro = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/pomodoro');
  };

  return (
    <DailyWidget
      title="Pomodoro"
      icon={Timer}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/pomodoro')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-red-600">
              {timeDisplay}
            </p>
            <p className="text-xs text-gray-500">
              de 5h ({completionRate.toFixed(0)}%)
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartPomodoro}
            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border-red-200"
          >
            <Play className="w-3 h-3" />
            {variant === 'detailed' && 'Iniciar'}
          </Button>
        </div>
        
        {variant === 'detailed' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progreso diario</span>
              <span>{completionRate.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessPomodoro;