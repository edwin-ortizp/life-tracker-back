// src/features/exercise/components/ExerciseSummary.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ExerciseLog, EXERCISES, EXERCISE_COLORS } from '../types';
import { Timer, Route, Dumbbell } from 'lucide-react';

interface ExerciseSummaryProps {
  exerciseLogs: ExerciseLog[];
}

interface CategorySummary {
  totalSessions: number;
  totalDuration: number;
  totalDistance: number;
  totalReps: number;
  progress: number;
}

const ExerciseSummary: React.FC<ExerciseSummaryProps> = ({ exerciseLogs }) => {
  const categorySummary = React.useMemo(() => {
    return exerciseLogs.reduce((summary, log) => {
      const exercise = EXERCISES.find(e => e.id === log.exerciseId);
      if (!exercise) return summary;

      if (!summary[exercise.category]) {
        summary[exercise.category] = {
          totalSessions: 0,
          totalDuration: 0,
          totalDistance: 0,
          totalReps: 0,
          progress: 0
        };
      }

      const cat = summary[exercise.category];
      cat.totalSessions++;

      if (log.duration) cat.totalDuration += log.duration;
      if (log.distance) cat.totalDistance += log.distance;
      if (log.sets && log.reps) cat.totalReps += (log.sets * log.reps);

      // Calcular progreso basado en objetivos predefinidos
      const categoryGoals = {
        cardio: { duration: 150 }, // 150 minutos semanales recomendados
        strength: { sessions: 3 }, // 3 sesiones semanales recomendadas
        flexibility: { duration: 60 }, // 60 minutos semanales recomendados
        balance: { duration: 45 } // 45 minutos semanales recomendados
      };

      const goal = categoryGoals[exercise.category];
      if ('duration' in goal) {
        cat.progress = Math.min(100, (cat.totalDuration / goal.duration) * 100);
      } else if ('sessions' in goal) {
        cat.progress = Math.min(100, (cat.totalSessions / goal.sessions) * 100);
      }

      return summary;
    }, {} as Record<string, CategorySummary>);
  }, [exerciseLogs]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardio':
        return <Route className="w-5 h-5" />;
      case 'strength':
        return <Dumbbell className="w-5 h-5" />;
      default:
        return <Timer className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(categorySummary).map(([category, stats]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className={`p-2 rounded-lg ${EXERCISE_COLORS[category]}/20`}>
                  {getCategoryIcon(category)}
                </span>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </CardTitle>
              <span className="text-sm text-gray-500">
                {stats.totalSessions} sesiones
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={stats.progress} />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {stats.totalDuration > 0 && (
                  <div>
                    <p className="text-gray-500">Tiempo total</p>
                    <p className="font-medium">{stats.totalDuration} min</p>
                  </div>
                )}
                
                {stats.totalDistance > 0 && (
                  <div>
                    <p className="text-gray-500">Distancia</p>
                    <p className="font-medium">{(stats.totalDistance / 1000).toFixed(1)} km</p>
                  </div>
                )}
                
                {stats.totalReps > 0 && (
                  <div>
                    <p className="text-gray-500">Repeticiones</p>
                    <p className="font-medium">{stats.totalReps}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExerciseSummary;