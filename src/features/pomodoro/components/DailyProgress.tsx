import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PomodoroSession } from '../types';

const formatTimeCompact = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

interface DailyProgressProps {
  sessions: PomodoroSession[];
  dailyGoal?: number; // en minutos, por defecto 5 horas = 300 minutos
}

export const DailyProgress = ({ sessions, dailyGoal = 300 }: DailyProgressProps) => {
  // Calcular tiempo efectivo (solo sesiones completadas)
  const effectiveTimeInSeconds = sessions
    .filter(session => session.completed)
    .reduce((acc, session) => acc + session.duration, 0);
  const effectiveTimeInMinutes = Math.floor(effectiveTimeInSeconds / 60);
  
  // Calcular progreso hacia la meta diaria
  const goalProgress = Math.min(Math.round((effectiveTimeInMinutes / dailyGoal) * 100), 100);
  const remainingTime = Math.max(dailyGoal - effectiveTimeInMinutes, 0);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Progreso Diario</h3>
          <span className="text-sm text-gray-500">
            Meta: {formatTimeCompact(dailyGoal)}
          </span>
        </div>

        <Progress 
          value={goalProgress} 
          className="h-3"
        />

        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="font-medium">{formatTimeCompact(effectiveTimeInMinutes)}</span>
            <span className="text-gray-500"> completados</span>
          </div>
          
          <div>
            <span className="text-gray-500">Faltan </span>
            <span className="font-medium">{formatTimeCompact(remainingTime)}</span>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          {goalProgress}% del objetivo diario
        </div>
      </div>
    </Card>
  );
};