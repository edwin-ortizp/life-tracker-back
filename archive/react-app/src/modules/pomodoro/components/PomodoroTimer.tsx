// src/modules/pomodoro/components/PomodoroTimer.tsx
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Play, Square, Loader2 } from 'lucide-react';

interface PomodoroTimerProps {
  time: string;
  isActive: boolean;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  disabled?: boolean;
}

export const PomodoroTimer = ({
  time,
  isActive,
  onStart,
  onStop,
  disabled
}: PomodoroTimerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleStop = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await onStop();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await onStart();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Display del timer */}
      <div className="text-6xl font-mono tracking-wider">
        {time}
      </div>

      {/* Controles */}
      <div className="flex gap-4">
        {!isActive ? (
          <Button
            size="lg"
            onClick={handleStart}
            disabled={disabled || isProcessing}
            className="w-40 text-lg"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            {isProcessing ? 'Iniciando...' : 'Iniciar'}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleStop}
            disabled={disabled || isProcessing}
            variant="destructive"
            className="w-40 text-lg"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Square className="w-5 h-5 mr-2" />
            )}
            {isProcessing ? 'Deteniendo...' : 'Detener'}
          </Button>
        )}
      </div>

      {/* Estado */}
      <div className="text-sm text-gray-500">
        {isActive ? (
          <>
            {isProcessing ? (
              <span>Procesando cambio de estado...</span>
            ) : (
              <span>Concentración en progreso...</span>
            )}
          </>
        ) : (
          <span>30 minutos de concentración</span>
        )}
      </div>
    </div>
  );
};