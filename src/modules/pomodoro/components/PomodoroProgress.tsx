// src/modules/pomodoro/components/PomodoroProgress.tsx
import { Progress } from '@/shared/components/ui/progress';

interface PomodoroProgressProps {
  progress: number;
  currentTime: string;
  totalTime: string;
  isActive: boolean;
}

export const PomodoroProgress = ({ progress,currentTime,totalTime,isActive}: PomodoroProgressProps) => {
  // Aseguramos que el progreso esté entre 0 y 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="space-y-2">
      {/* Barra de progreso */}
      <Progress 
        value={normalizedProgress} 
        className={`h-2 transition-all duration-300 ${
          isActive ? 'bg-gray-100' : 'bg-gray-50'
        }`}
      />

      {/* Indicadores de tiempo */}
      <div className="flex justify-between items-center px-1">
        <div className="text-sm">
          <span className="font-medium">{currentTime}</span>
          <span className="text-gray-500"> restantes</span>
        </div>
        
        <div className="text-sm text-gray-500">
          <span>Total: </span>
          <span className="font-medium">{totalTime}</span>
        </div>
      </div>

      {/* Indicador visual del progreso */}
      <div className="text-center text-sm text-gray-500">
        {normalizedProgress > 0 && (
          <span>{Math.round(normalizedProgress)}% completado</span>
        )}
      </div>
    </div>
  );
};

export default PomodoroProgress;