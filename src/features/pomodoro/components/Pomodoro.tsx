import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePomodoroTimer, usePomodoroData } from '../hooks';
import { PomodoroCounter } from './PomodoroCounter';
import { PomodoroHistory } from './PomodoroHistory';
import { PomodoroEditModal } from './PomodoroEditModal';
import type { PomodoroSession } from '../types';

interface PomodoroProps {
  selectedDate?: Date;
}

const formatTimeExtended = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

export const Pomodoro = ({ selectedDate }: PomodoroProps) => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<PomodoroSession | null>(null);
  const dailyGoal = 300; // 5 horas en minutos
  
  const { 
    count,
    sessions,
    status,
    error,
    saveSession,
    deleteSession,
    editSession,
    addManualSession
  } = usePomodoroData(selectedDate);

  const { 
    isActive,
    formattedTime,
    startTimer,
    pauseTimer,
    resetTimer
  } = usePomodoroTimer({
    onComplete: (duration) => saveSession(duration, true),
    onCancel: (duration) => saveSession(duration, false)
  });

  const handleIncrement = async () => {
    if (status === 'saving') return;
    await addManualSession();
  };

  // Calcular tiempo efectivo del día
  const effectiveTimeInSeconds = sessions
    .filter(session => session.completed)
    .reduce((acc, session) => acc + session.duration, 0);
  const effectiveTimeInMinutes = Math.floor(effectiveTimeInSeconds / 60);
  const dailyProgress = Math.min(Math.round((effectiveTimeInMinutes / dailyGoal) * 100), 100);

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para usar el temporizador Pomodoro</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h2 className="text-lg font-medium">Pomodoro Timer</h2>
          </div>
          
          <PomodoroCounter
            count={count}
            onIncrement={handleIncrement}
            disabled={status === 'saving'}
            status={status}
          />
        </div>

        {/* Progreso diario */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-rose-600">
              {formatTimeExtended(effectiveTimeInMinutes)} completados
            </span>
            <span className="text-gray-500">
              Meta: {formatTimeExtended(dailyGoal)}
            </span>
          </div>
          <Progress 
            value={dailyProgress} 
            className="h-2 bg-gray-100"
          />
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold tracking-tight mb-4">
            {formattedTime}
          </div>

          <div className="flex gap-2 justify-center mb-3">
            <button
              onClick={isActive ? pauseTimer : startTimer}
              disabled={status === 'saving'}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isActive ? 'Pausar' : 'Iniciar'}
            </button>

            <button
              onClick={resetTimer}
              disabled={status === 'saving'}
              className="px-6 py-2 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          <p className="text-sm text-gray-500">
            {isActive ? 'Concentración en progreso...' : '¿Listo para empezar?'}
          </p>
        </div>

        <PomodoroHistory 
          sessions={sessions}
          onEditSession={setSelectedSession}
          onDeleteSession={deleteSession}
        />

        <PomodoroEditModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSave={editSession}
        />

        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Pomodoro;