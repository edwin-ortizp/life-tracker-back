import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Trophy, Clock, Target } from 'lucide-react';
import type { PomodoroSession } from '../models';

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

const getMotivationalMessage = (progress: number): {
  icon: React.ElementType;
  message: string;
  description: string;
  color: string;
} => {
  if (progress === 100) {
    return {
      icon: Trophy,
      message: "¡Meta diaria alcanzada! 🎉",
      description: "Has completado tu objetivo del día ¡Excelente trabajo!",
      color: "text-green-600"
    };
  }
  if (progress >= 75) {
    return {
      icon: Target,
      message: "¡Casi ahí! 💪",
      description: "Estás muy cerca de alcanzar tu meta diaria",
      color: "text-blue-600"
    };
  }
  if (progress >= 50) {
    return {
      icon: Clock,
      message: "¡Buen progreso! 👍",
      description: "Mantén el ritmo, vas por buen camino",
      color: "text-indigo-600"
    };
  }
  if (progress >= 25) {
    return {
      icon: Clock,
      message: "¡Sigue adelante! 🎯",
      description: "Has comenzado bien, mantén el enfoque",
      color: "text-blue-600"
    };
  }
  return {
    icon: Clock,
    message: "¡Comencemos! 🚀",
    description: "Es un buen momento para enfocarse en tus objetivos",
    color: "text-gray-600"
  };
};

const getProgressStyle = (progress: number): {
  background: string;
  text: string;
  icon: string;
} => {
  if (progress >= 100) {
    return {
      background: "bg-green-500",
      text: "text-green-700",
      icon: "bg-green-100"
    };
  }
  if (progress >= 75) {
    return {
      background: "bg-blue-500",
      text: "text-blue-700",
      icon: "bg-blue-100"
    };
  }
  if (progress >= 50) {
    return {
      background: "bg-indigo-500",
      text: "text-indigo-700",
      icon: "bg-indigo-100"
    };
  }
  if (progress >= 25) {
    return {
      background: "bg-blue-500",
      text: "text-blue-700",
      icon: "bg-blue-100"
    };
  }
  return {
    background: "bg-gray-500",
    text: "text-gray-700",
    icon: "bg-gray-100"
  };
};

export const DailyProgress = ({ sessions, dailyGoal = 300 }: DailyProgressProps) => {
  // Calcular tiempo efectivo (solo sesiones completadas)
  const effectiveTimeInSeconds = sessions
    .filter(session => session.completed)
    .reduce((acc, session) => acc + session.duration, 0);
  const effectiveTimeInMinutes = Math.floor(effectiveTimeInSeconds / 60);
  
  // Calcular progreso hacia la meta diaria
  const goalProgress = Math.min(Math.round((effectiveTimeInMinutes / dailyGoal) * 100), 100);
  const remainingTime = Math.max(dailyGoal - effectiveTimeInMinutes, 0);

  // Obtener mensaje motivacional y estilos según el progreso
  const { icon: MotivationalIcon, message, description, color } = getMotivationalMessage(goalProgress);
  const styles = getProgressStyle(goalProgress);

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-gray-50">
      <div className="space-y-6">
        {/* Encabezado con mensaje motivacional */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${styles.icon} mt-1`}>
            <MotivationalIcon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <h3 className={`font-semibold text-lg ${color}`}>{message}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        {/* Meta diaria */}
        <div className="text-sm text-gray-600 flex justify-between items-center">
          <span>Meta diaria: {formatTimeCompact(dailyGoal)}</span>
          <span className={`font-medium ${color}`}>{goalProgress}% completado</span>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-4">
          <Progress 
            value={goalProgress} 
            className="h-3" // Removed ${styles.background}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tiempo efectivo</p>
              <p className={`text-lg font-semibold ${styles.text}`}>
                {formatTimeCompact(effectiveTimeInMinutes)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Tiempo restante</p>
              <p className="text-lg font-semibold text-gray-700">
                {formatTimeCompact(remainingTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de progreso */}
        <div className="text-center">
          {goalProgress < 100 ? (
            <p className="text-sm text-gray-600">
              Te faltan <span className="font-medium">{formatTimeCompact(remainingTime)}</span> para alcanzar tu meta diaria
            </p>
          ) : (
            <p className="text-sm font-medium text-green-600">
              ¡Felicitaciones! Has superado tu meta diaria de productividad 🎉
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};