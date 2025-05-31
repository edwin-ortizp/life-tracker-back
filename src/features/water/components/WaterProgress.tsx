// src/features/water/components/WaterProgress.tsx
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Droplet } from 'lucide-react';

interface WaterProgressProps {
  intake: number;
  goal: number;
}

export const WaterProgress: React.FC<WaterProgressProps> = ({ intake, goal }) => {
  const getMotivationalMessage = () => {
    const percentage = (intake/goal) * 100;
    if (percentage >= 100) return "¡Excelente! Has alcanzado tu meta diaria 🎉";
    if (percentage >= 75) return "¡Vas muy bien! Ya casi llegas a tu meta 💪";
    if (percentage >= 50) return "¡A mitad de camino! Sigue así 🌊";
    if (percentage >= 25) return "¡Buen comienzo! Mantén el ritmo 💧";
    return "¡Comienza tu día con buena hidratación! 🚰";
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg flex items-center gap-2">
          <Droplet className="w-5 h-5" />
          Hidratación
        </h3>
        <div className="text-right">
          <div className={intake > goal ? 'text-blue-500 font-medium' : ''}>
            {intake}ml / {goal}ml
          </div>
          <div className="text-xs text-gray-500">
            {intake > goal ? `+${intake - goal}ml extra` : ''}
          </div>
        </div>
      </div>

      <Progress 
        value={Math.min((intake/goal)*100, 100)} 
        className="h-3" // Removed conditional background class
      />
      <p className="text-sm text-gray-600 mt-2 text-center">
        {getMotivationalMessage()}
      </p>
    </div>
  );
};