// src/features/pomodoro/components/PomodoroTimer.tsx
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PomodoroTimerProps {
  time: string;
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export const PomodoroTimer = ({time,isActive,onStart,onPause,onReset,disabled}: PomodoroTimerProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Display del timer */}
      <div className="text-5xl font-bold tracking-tight">
        {time}
      </div>

      {/* Controles */}
      <div className="flex gap-2">
        <Button
          size="lg"
          onClick={isActive ? onPause : onStart}
          disabled={disabled}
          className="w-32"
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          disabled={disabled}
          className="w-24"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Texto informativo */}
      <div className="text-sm text-gray-500">
        {isActive ? (
          <span>Concentración en progreso...</span>
        ) : (
          <span>¿Listo para empezar?</span>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;