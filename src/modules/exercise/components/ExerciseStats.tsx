import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { ExerciseLog, EXERCISE_CATEGORIES, ExerciseSummary } from '../models';
import { useExerciseTypes } from '../controllers/useExerciseTypes';
import { Footprints, Timer, Flame, Activity } from 'lucide-react';
import { getLocalDateString } from '@/shared/utils/dates';

interface ExerciseStatsProps {
  exerciseLogs: ExerciseLog[];
  summary?: ExerciseSummary;
}

interface ChartDataPoint {
  date: string;
  calories: number;
  steps: number;
  duration: number;
  distance: number;
}

export const ExerciseStats: React.FC<ExerciseStatsProps> = ({
  exerciseLogs,
  summary: providedSummary
}) => {
  const { getExerciseTypeById } = useExerciseTypes();

  // Si no se proporciona un resumen, lo calculamos de los logs
  const calculatedSummary = React.useMemo(() => {
    if (providedSummary) return providedSummary;

    return {
      totalCalories: exerciseLogs.reduce((sum, log) => sum + (log.calories || 0), 0),
      totalSteps: exerciseLogs.reduce((sum, log) => sum + (log.steps || 0), 0),
      totalDuration: exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
      totalDistance: exerciseLogs.reduce((sum, log) => sum + (log.distance || 0), 0),
      categoryStats: exerciseLogs.reduce((stats, log) => {
        const exercise = getExerciseTypeById(log.exerciseId);
        if (!exercise) return stats;

        if (!stats[exercise.category]) {
          stats[exercise.category] = { count: 0, duration: 0, calories: 0 };
        }

        stats[exercise.category].count += 1;
        stats[exercise.category].duration += log.duration || 0;
        stats[exercise.category].calories += log.calories || 0;

        return stats;
      }, {} as ExerciseSummary['categoryStats'])
    };
  }, [exerciseLogs, providedSummary]);

  const formatDateAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTooltipDate = (value?: string | number, name?: string) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (value === undefined) {
      return '';
    }
    return name ? [value.toLocaleString(), name] : value.toLocaleString();
  };

  // Agrupar los datos para el gráfico por fecha
  const chartData = React.useMemo(() => {
    // Obtenemos la fecha actual y creamos un rango de 7 días hacia atrás
    const today = new Date();
    const data: ChartDataPoint[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getLocalDateString(date);
      
      data.push({
        date: dateStr,
        calories: 0,
        steps: 0,
        duration: 0,
        distance: 0
      });
    }

    // Ahora agregamos los datos de los ejercicios
    exerciseLogs.forEach(log => {
      const dataPoint = data.find(d => d.date === getLocalDateString(new Date()));
      if (dataPoint) {
        dataPoint.calories += log.calories || 0;
        dataPoint.steps += log.steps || 0;
        dataPoint.duration += log.duration || 0;
        dataPoint.distance += (log.distance || 0) / 1000; // Convertir a km
      }
    });

    return data;
  }, [exerciseLogs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Calorías</p>
              <h4 className="text-2xl font-bold">{calculatedSummary.totalCalories}</h4>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Footprints className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pasos</p>
              <h4 className="text-2xl font-bold">{calculatedSummary.totalSteps.toLocaleString()}</h4>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Timer className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiempo</p>
              <h4 className="text-2xl font-bold">{calculatedSummary.totalDuration} min</h4>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Distancia</p>
              <h4 className="text-2xl font-bold">{(calculatedSummary.totalDistance / 1000).toFixed(1)} km</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calories">
            <TabsList className="grid grid-cols-4 h-12">
              <TabsTrigger value="calories" className="text-base">Calorías</TabsTrigger>
              <TabsTrigger value="steps" className="text-base">Pasos</TabsTrigger>
              <TabsTrigger value="duration" className="text-base">Tiempo</TabsTrigger>
              <TabsTrigger value="distance" className="text-base">Distancia</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calories" className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDateAxis} />
                  <YAxis />
                  <Tooltip 
                    formatter={formatTooltipDate}
                    labelFormatter={formatDateAxis}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#f97316"
                    name="Calorías"
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="steps" className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDateAxis} />
                  <YAxis />
                  <Tooltip 
                    formatter={formatTooltipDate}
                    labelFormatter={formatDateAxis}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    stroke="#3b82f6"
                    name="Pasos"
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="duration" className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDateAxis} />
                  <YAxis />
                  <Tooltip 
                    formatter={formatTooltipDate}
                    labelFormatter={formatDateAxis}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="#22c55e"
                    name="Minutos"
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="distance" className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDateAxis} />
                  <YAxis />
                  <Tooltip 
                    formatter={formatTooltipDate}
                    labelFormatter={formatDateAxis}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="distance"
                    stroke="#a855f7"
                    name="Kilómetros"
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(EXERCISE_CATEGORIES).map(([category, info]) => {
                const categoryStats = calculatedSummary.categoryStats[category as keyof typeof calculatedSummary.categoryStats] || {
                  count: 0,
                  duration: 0,
                  calories: 0
                };

                return {
                  category: info.name,
                  minutos: categoryStats.duration,
                  calorias: categoryStats.calories
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis yAxisId="left" orientation="left" stroke="#f97316" />
                <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="calorias" fill="#f97316" name="Calorías" />
                <Bar yAxisId="right" dataKey="minutos" fill="#22c55e" name="Minutos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
