import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { useNavigate } from 'react-router-dom';
import { useDailySummary } from '@/features/statistics/hooks/useDailySummary';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DaySummaryProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const DaySummary: React.FC<DaySummaryProps> = ({
  date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();
  const { summary, loading, error } = useDailySummary(date);

  const todayString = format(date, 'EEEE, d MMMM', { locale: es });
  
  const metrics = [
    {
      label: 'Hábitos',
      value: `${summary.habits.completed}/${summary.habits.total}`,
      progress: summary.habits.total > 0 ? (summary.habits.completed / summary.habits.total) * 100 : 0,
      color: 'bg-green-500'
    },
    {
      label: 'Agua',
      value: `${summary.water.intake}ml`,
      progress: Math.min((summary.water.intake / 2000) * 100, 100),
      color: 'bg-blue-500'
    },
    {
      label: 'Tareas',
      value: `${summary.tasks.completed}/${summary.tasks.todayPlanned}`,
      progress: summary.tasks.todayPlanned > 0 ? (summary.tasks.completed / summary.tasks.todayPlanned) * 100 : 0,
      color: 'bg-purple-500'
    },
    {
      label: 'Ánimo',
      value: summary.mood.count > 0 ? `${summary.mood.average.toFixed(1)}/10` : 'Sin datos',
      progress: summary.mood.average * 10,
      color: 'bg-yellow-500'
    }
  ];

  const hasData = Object.values(summary).some(moduleData =>
    Object.values(moduleData).some(v => typeof v === 'number' && v > 0)
  );

  return (
    <DailyWidget
      title={variant === 'detailed' ? `Resumen - ${todayString}` : 'Resumen del Día'}
      icon={variant === 'detailed' ? Calendar : TrendingUp}
      variant={variant}
      loading={loading}
      error={error || undefined}
      onClick={() => navigate('/stats')}
    >
      {!hasData ? (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            No hay datos registrados para hoy
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {variant === 'compact' ? (
            <div className="grid grid-cols-2 gap-2">
              {metrics.slice(0, 4).map((metric, index) => (
                <div key={index} className="text-center">
                  <p className="text-xs text-gray-500">{metric.label}</p>
                  <p className="text-sm font-medium">{metric.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.map((metric, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metric.label}</span>
                    <span className="text-sm text-gray-600">{metric.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`${metric.color} h-1.5 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(metric.progress, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              
              {summary.exercise.minutes > 0 && (
                <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                  <p>💪 {summary.exercise.minutes} min de ejercicio</p>
                </div>
              )}
              
              {summary.journal.words > 0 && (
                <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                  <p>📝 {summary.journal.words} palabras en el diario</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DailyWidget>
  );
};

export default DaySummary;