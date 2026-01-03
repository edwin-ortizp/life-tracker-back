import React from 'react';
import { Smile, Plus } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useMoodData } from '@/features/mood/hooks/useMoodData.supabase';
import { calculateMoodAverage } from '@/features/mood/types';

interface QuickAccessMoodProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessMood: React.FC<QuickAccessMoodProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { moodHistory, status } = useMoodData(date);
  const loading = status === 'saving' || status === 'pending';

  const moods = moodHistory || [];
  const moodCount = moods.length;
  const averageMood = moods.length > 0 ? calculateMoodAverage(moods) : 0;
  const lastMood = moods[moods.length - 1];

  const getMoodEmoji = (value: number) => {
    if (value >= 8) return '😊';
    if (value >= 6) return '🙂';
    if (value >= 4) return '😐';
    if (value >= 2) return '😔';
    return '😢';
  };

  return (
    <DailyWidget
      title="Estado de Ánimo"
      icon={Smile}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/mood')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            {moodCount > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{lastMood?.emoji || getMoodEmoji(averageMood)}</span>
                  <div>
                    <p className="text-sm font-medium">
                      {averageMood.toFixed(1)}/10
                    </p>
                    <p className="text-xs text-gray-500">
                      {moodCount} registro{moodCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">😐</span>
                <p className="text-sm text-gray-500">Sin registros</p>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/mood');
            }}
            className="flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            {variant === 'detailed' && 'Registrar'}
          </Button>
        </div>
        
        {variant === 'detailed' && lastMood && (
          <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
            <p className="font-medium">Último registro:</p>
            <p>"{lastMood.text}" - {lastMood.time}</p>
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessMood;