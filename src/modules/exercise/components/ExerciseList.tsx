// src/modules/exercise/components/ExerciseList.tsx
import React from 'react';
import { Trash2, Pencil, Flame, Footprints } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ExerciseLog, EXERCISE_COLORS } from '../models';
import { useExerciseTypes } from '../controllers/useExerciseTypes';
import { Progress } from '@/shared/components/ui/progress';
import { Card, CardContent } from "@/shared/components/ui/card";

interface ExerciseListProps {
  exerciseLogs: ExerciseLog[];
  onUpdate: (index: number) => void;
  onDelete: (index: number) => void;
  isLoading?: boolean;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({
  exerciseLogs,
  onUpdate,
  onDelete,
  isLoading
}) => {
  const { getExerciseTypeById } = useExerciseTypes();

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
    const exercise = getExerciseTypeById(log.exerciseId);
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
    const exercise = getExerciseTypeById(log.exerciseId);
    if (!exercise) return 0;

    // Exercise types from DB don't have default values, so always return 100% for now
    return 100;
  };

  const getDailyStatsCard = () => {
    const totalCalories = exerciseLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
    const totalSteps = exerciseLogs.reduce((sum, log) => sum + (log.steps || 0), 0);
    const totalDuration = exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    if (totalCalories === 0 && totalSteps === 0) return null;

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {getDailyStatsCard()}
      
      {exerciseLogs.map((log, index) => {
        const exercise = getExerciseTypeById(log.exerciseId);
        if (!exercise) return null;

        return (
          <Card key={index}>
            <CardContent className="p-4">
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
                    onClick={() => onUpdate(index)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(index)}
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
                </div>

                <Progress value={calculateProgress(log)} className="h-2" />

                {log.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    {log.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};