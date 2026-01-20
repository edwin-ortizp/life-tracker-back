import React from 'react';
import { Droplets } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useWaterData } from '@/features/water/hooks/useWaterData.supabase';

interface QuickAccessWaterProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessWater: React.FC<QuickAccessWaterProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { intake, status, addDrink } = useWaterData(date);
  const loading = status === 'saving' || status === 'pending';

  const handleAdd100 = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addDrink('water', 100);
  };

  const handleAdd300 = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addDrink('water', 300);
  };

  const handleAdd600 = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addDrink('water', 600);
  };

  const totalIntake = intake || 0;
  const dailyGoal = 2000; // 2L goal
  const percentage = Math.min((totalIntake / dailyGoal) * 100, 100);

  return (
    <DailyWidget
      title="Hidratación"
      icon={Droplets}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/water/view/daily')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-blue-600">
              {totalIntake}ml
            </p>
            <p className="text-xs text-gray-500">
              de {dailyGoal}ml ({percentage.toFixed(0)}%)
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1 min-w-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd100}
              className="px-1 py-1 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 min-w-0 flex-shrink-0"
              disabled={loading}
            >
              {variant === 'detailed' ? '100ml' : '100'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd300}
              className="px-1 py-1 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 min-w-0 flex-shrink-0"
              disabled={loading}
            >
              {variant === 'detailed' ? '300ml' : '300'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd600}
              className="px-1 py-1 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 min-w-0 flex-shrink-0"
              disabled={loading}
            >
              {variant === 'detailed' ? '600ml' : '600'}
            </Button>
          </div>
        </div>
        
        {variant === 'detailed' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessWater;
