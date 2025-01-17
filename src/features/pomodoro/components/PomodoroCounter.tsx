// src/features/pomodoro/components/PomodoroCounter.tsx
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface PomodoroCounterProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export const PomodoroCounter = ({
  count,
  onIncrement,
  onDecrement,
  disabled,
  status
}: PomodoroCounterProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onDecrement}
        disabled={disabled || count === 0}
        className="h-8 w-8"
      >
        <Minus className="w-4 h-4" />
      </Button>

      <div className="flex flex-col items-center min-w-[3rem]">
        <span className="font-medium text-lg">{count}</span>
        <span className="text-xs text-gray-500">ciclos</span>
      </div>

      <Button 
        variant="outline" 
        size="icon" 
        onClick={onIncrement}
        disabled={disabled}
        className="h-8 w-8"
      >
        <Plus className="w-4 h-4" />
      </Button>

      {status === 'saving' && (
        <span className="text-xs text-blue-500 animate-pulse">
          Guardando...
        </span>
      )}
      {status === 'error' && (
        <span className="text-xs text-red-500">
          Error al guardar
        </span>
      )}
    </div>
  );
};

export default PomodoroCounter;