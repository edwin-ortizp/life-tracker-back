// src/features/pomodoro/components/Pomodoro.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DailyStats } from './DailyStats';
import { Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePomodoroTimer, usePomodoroData } from '../hooks';
import { PomodoroCounter } from './PomodoroCounter';
import { PomodoroProgress } from './PomodoroProgress';
import { PomodoroTimer } from './PomodoroTimer';
import { PomodoroHistory } from './PomodoroHistory';
import { PomodoroEditModal } from './PomodoroEditModal';
import type { PomodoroSession } from '../types';

interface PomodoroProps {
  selectedDate?: Date;
}

export const Pomodoro = ({ selectedDate }: PomodoroProps) => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<PomodoroSession | null>(null);
  
  const { 
    count,
    sessions,
    status,
    error,
    saveSession,
    updateCount,
    deleteSession,
    editSession,
    addManualSession
  } = usePomodoroData(selectedDate);

  const { 
    isActive,
    formattedTime,
    progress,
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
            onDecrement={() => updateCount(Math.max(0, count - 1))}
            disabled={status === 'saving'}
            status={status}
          />
        </div>

        <PomodoroProgress
          progress={progress}
          currentTime={formattedTime}
          totalTime="30:00"
          isActive={isActive}
        />

        <PomodoroTimer
          time={formattedTime}
          isActive={isActive}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          disabled={status === 'saving'}
        />

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
        <DailyStats sessions={sessions} />
      </CardContent>
    </Card>
  );
};

export default Pomodoro;