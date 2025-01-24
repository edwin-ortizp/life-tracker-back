// src/features/exercise/components/ExerciseList.tsx
import React from 'react';
import { Trash2, Pencil, Flame, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseLog, EXERCISES, EXERCISE_COLORS } from '../types';
import { Progress } from '@/components/ui/progress';
import { formatDateToSpanishWithUTC } from '@/utils/dates';

interface ExerciseListProps {
  exerciseLogs: ExerciseLog[];
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exerciseLogs,
  onUpdate,
  onDelete,
  isLoading
}) => {
  if (isLoading) {
    return <div className="text-center py-8">Cargando ejercicios...</div>;
  }

  if (exerciseLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay ejercicios registrados para este día
      </div>
    );
  }

  const formatExerciseDetail = (log: ExerciseLog) => {
    const exercise = EXERCISES.find(e => e.id === log.exerciseId);
    if (!exercise) return '';

    const details = [];
    
    if (log.sets && log.reps) {
      details.push(`${log.sets} series x ${log.reps} repeticiones`);
    }
    
    if (log.duration) {
      details.push(`${log.duration} minutos`);
    }
    
    if (log.distance) {
      details.push(`${(log.distance / 1000).toFixed(2)} km`);
    }

    if (log.steps) {
      details.push(`${log.steps.toLocaleString()} pasos`);
    }
    
    if (log.weight) {
      details.push(`${log.weight}kg`);
    }

    return details.join(' • ');
  };

  const calculateProgress = (log: ExerciseLog) => {
    const exercise = EXERCISES.find(e => e.id === log.exerciseId);
    if (!exercise) return 0;

    if (exercise.defaultDuration && log.duration) {
      return (log.duration / exercise.defaultDuration) * 100;
    }

    if (exercise.defaultDistance && log.distance) {
      return (log.distance / exercise.defaultDistance) * 100;
    }

    if (exercise.defaultSets && exercise.defaultReps && log.sets && log.reps) {
      return ((log.sets * log.reps) / (exercise.defaultSets * exercise.defaultReps)) * 100;
    }

    return 100;
  };

  const getDailyStatsCard = () => {
    const totalCalories = exerciseLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
    const totalSteps = exerciseLogs.reduce((sum, log) => sum + (log.steps || 0), 0);
    const totalDuration = exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    if (totalCalories === 0 && totalSteps === 0) return null;

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium mb-3">Resumen del día</h3>
        <div className="grid grid-cols-3 gap-4">
          {totalCalories > 0 && (
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">{totalCalories}</p>
                <p className="text-xs text-gray-500">calorías</p>
              </div>
            </div>
          )}
          {totalSteps > 0 && (
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{totalSteps.toLocaleString()}</p>
                <p className="text-xs text-gray-500">pasos</p>
              </div>
            </div>
          )}
          {totalDuration > 0 && (
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm font-medium">{totalDuration}</p>
                <p className="text-xs text-gray-500">minutos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {getDailyStatsCard()}
      
      {exerciseLogs.map(log => {
        const exercise = EXERCISES.find(e => e.id === log.exerciseId);
        if (!exercise) return null;

        return (
          <div
            key={log.id}
            className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{exercise.icon}</span>
                <div>
                  <h4 className="font-medium">{exercise.name}</h4>
                  <p className="text-sm text-gray-500">{formatExerciseDetail(log)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdate(log.id)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(log.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex gap-3">
                  <span className={`px-2 py-1 rounded-full ${EXERCISE_COLORS[exercise.category]} text-white`}>
                    {exercise.category}
                  </span>
                  {log.calories && (
                    <span className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-4 h-4" />
                      {log.calories} kcal
                    </span>
                  )}
                </div>
                <span className="text-gray-500">
                  {formatDateToSpanishWithUTC(new Date(log.date))}
                </span>
              </div>

              <Progress value={calculateProgress(log)} className="h-2" />
              
              {log.notes && (
                <p className="text-sm text-gray-600 mt-2">
                  {log.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};