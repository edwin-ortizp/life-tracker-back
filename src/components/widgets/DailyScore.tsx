import React from 'react';
import { Award, TrendingUp } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { useNavigate } from 'react-router-dom';
import { useDailySummary } from '@/features/statistics/hooks/useDailySummary';

interface DailyScoreProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const DailyScore: React.FC<DailyScoreProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { summary, loading } = useDailySummary(date);

  // Calculate overall score based on different metrics
  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    // Habits score (30% weight)
    const habitsScore = summary.habits.total > 0 ? (summary.habits.completed / summary.habits.total) * 30 : 0;
    totalScore += habitsScore;
    maxScore += 30;

    // Water score (20% weight)
    const waterScore = Math.min((summary.water.intake / 2000) * 20, 20);
    totalScore += waterScore;
    maxScore += 20;

    // Tasks score (25% weight)
    const tasksScore = summary.tasks.activeAndOverdue > 0 ? 
      (summary.tasks.completed / summary.tasks.activeAndOverdue) * 25 : 0;
    totalScore += tasksScore;
    maxScore += 25;

    // Exercise score (15% weight)
    const exerciseScore = Math.min((summary.exercise.calories / 500) * 15, 15);
    totalScore += exerciseScore;
    maxScore += 15;

    // Journal score (10% weight)
    const journalScore = summary.journal.words > 0 ? 10 : 0;
    totalScore += journalScore;
    maxScore += 10;

    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  };

  const score = calculateScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return '¡Excelente día!';
    if (score >= 60) return '¡Buen progreso!';
    if (score >= 40) return 'Sigue así';
    return 'Puedes mejorar';
  };

  return (
    <DailyWidget
      title="Score Diario"
      icon={Award}
      variant={variant}
      loading={loading}
      onClick={() => navigate('/stats')}
    >
      <div className="space-y-2">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {getScoreMessage(score)}
          </p>
        </div>
        
        {variant === 'detailed' && (
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`${getScoreBgColor(score)} h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2`}
              style={{ width: `${score}%` }}
            >
              {score > 20 && (
                <TrendingUp className="w-3 h-3 text-white" />
              )}
            </div>
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default DailyScore;