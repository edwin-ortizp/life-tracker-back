import { Card } from '@/shared/components/ui/card';
import type { PomodoroSession } from '../models';
import { Progress } from '@/shared/components/ui/progress';

const formatTimeCompact = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

interface DailyStatsProps {
  sessions: PomodoroSession[];
  dailyGoal?: number; // en minutos, por defecto 5 horas = 300 minutos
}

export const DailyStats = ({ sessions, dailyGoal = 300 }: DailyStatsProps) => {
  // Calcular tiempo total trabajado
  const totalTimeInSeconds = sessions.reduce((acc, session) => acc + session.duration, 0);
  const totalTimeInMinutes = Math.floor(totalTimeInSeconds / 60);
  
  // Calcular tiempo efectivo (solo sesiones completadas)
  const effectiveTimeInSeconds = sessions
    .filter(session => session.completed)
    .reduce((acc, session) => acc + session.duration, 0);
  const effectiveTimeInMinutes = Math.floor(effectiveTimeInSeconds / 60);
  
  // Calcular porcentaje de tiempo efectivo
  const effectivePercentage = totalTimeInSeconds > 0 
    ? Math.round((effectiveTimeInSeconds / totalTimeInSeconds) * 100) 
    : 0;

  // Calcular progreso hacia la meta diaria
  const goalProgress = Math.min(Math.round((effectiveTimeInMinutes / dailyGoal) * 100), 100);

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <Card className="p-3">
        <p className="text-sm text-gray-600">Tiempo Total</p>
        <p className="font-semibold leading-tight">
          {formatTimeCompact(totalTimeInMinutes)}
        </p>
      </Card>
      
      <Card className="p-3">
        <p className="text-sm text-gray-600">Tiempo Efectivo</p>
        <p className="font-semibold leading-tight">
          {formatTimeCompact(effectiveTimeInMinutes)}
        </p>
        <p className="text-xs text-gray-400">
          {effectivePercentage}% completado
        </p>
        <p className="text-xs text-gray-400">
          {formatTimeCompact(dailyGoal - effectiveTimeInMinutes)} para meta
        </p>
      </Card>

      <Card className="p-3">
        <p className="text-sm text-gray-600">Sesiones Completadas</p>
        <p className="text-xl font-semibold leading-tight">
          {sessions.filter(s => s.completed).length}/{sessions.length}
        </p>
        <Progress value={goalProgress} className="h-1 mt-1" />
        {/* Added mt-1 to Progress className as it was on the parent div */}
      </Card>
    </div>
  );
};