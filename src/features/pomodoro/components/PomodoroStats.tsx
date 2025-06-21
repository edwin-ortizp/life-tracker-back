// src/features/pomodoro/components/PomodoroStats.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePomodoroStats } from '../hooks';
import { formatDuration } from '../utils/formatTime';
import { useAuth } from '@/hooks/useAuth';

interface PomodoroStatsProps {
  dateRange: 'week' | 'month';
}

export const PomodoroStats = ({ dateRange }: PomodoroStatsProps) => {
  const { user } = useAuth();
  const { stats, loading, error } = usePomodoroStats(dateRange);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Estadísticas ({dateRange === 'week' ? 'Semana' : 'Mes'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <p className="text-gray-500">Cargando estadísticas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Estadísticas ({dateRange === 'week' ? 'Semana' : 'Mes'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Error al cargar las estadísticas. Por favor, intenta de nuevo.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Estadísticas ({dateRange === 'week' ? 'Semana' : 'Mes'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Estadísticas {dateRange === 'week' ? 'de la Semana' : 'del Mes'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-center text-sm">
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-xs">Sesiones</p>
            <p className="text-lg font-semibold">{stats.totalSessions}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-xs">Tiempo Total</p>
            <p className="text-lg font-semibold">
              {formatDuration(Math.floor(stats.totalTime / 60))}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-xs">Promedio/Sesión</p>
            <p className="text-lg font-semibold">
              {formatDuration(Math.floor(stats.averageSessionTime / 60))}
            </p>
          </div>
          {dateRange === 'week' ? (
            <div className="space-y-0.5 col-span-2">
              <p className="text-muted-foreground text-xs">Promedio diario</p>
              <p className="text-lg font-semibold">
                {stats.averageWeekdayHours?.toFixed(1)}h/día
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-muted-foreground text-xs">Completitud</p>
              <p className="text-lg font-semibold">
                {stats.completionRate.toFixed(1)}%
              </p>
            </div>
          )}
          {stats.bestDay && (
            <div className="space-y-0.5 col-span-2">
              <p className="text-muted-foreground text-xs">Mejor Día</p>
              <p className="text-lg font-semibold">
                {formatDuration(Math.floor(stats.bestDay.minutes))}
              </p>
              <p className="text-xs text-gray-400">{stats.bestDay.date}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};