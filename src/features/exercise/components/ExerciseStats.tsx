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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ExerciseLog, EXERCISES, EXERCISE_CATEGORIES } from '../types';
import { Footprints, Timer, Flame, Activity } from 'lucide-react';

interface ExerciseStatsProps {
  exerciseLogs: ExerciseLog[];
}

export const ExerciseStats: React.FC<ExerciseStatsProps> = ({
  exerciseLogs
}) => {
  const calculateTotalStats = () => {
    return exerciseLogs.reduce((acc, log) => {
      acc.calories += log.calories || 0;
      acc.duration += log.duration || 0;
      acc.steps += log.steps || 0;
      if (log.distance) {
        acc.distance += log.distance;
      }
      return acc;
    }, {
      calories: 0,
      duration: 0,
      steps: 0,
      distance: 0
    });
  };

  const totalStats = calculateTotalStats();

  const formatDateAxis = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTooltipDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getChartData = () => {
    // Ordenar los logs por fecha
    const sortedLogs = [...exerciseLogs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Agrupar por fecha
    return sortedLogs.reduce((acc, log) => {
      if (!acc[log.date]) {
        acc[log.date] = {
          date: log.date,
          calories: 0,
          steps: 0,
          duration: 0,
          distance: 0
        };
      }
      acc[log.date].calories += log.calories || 0;
      acc[log.date].steps += log.steps || 0;
      acc[log.date].duration += log.duration || 0;
      acc[log.date].distance += (log.distance || 0) / 1000; // Convertir a km
      return acc;
    }, {} as Record<string, any>);
  };

  const chartData = Object.values(getChartData());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Calorías</p>
              <h4 className="text-2xl font-bold">{totalStats.calories}</h4>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Footprints className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pasos</p>
              <h4 className="text-2xl font-bold">{totalStats.steps.toLocaleString()}</h4>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Timer className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiempo</p>
              <h4 className="text-2xl font-bold">{totalStats.duration} min</h4>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Distancia</p>
              <h4 className="text-2xl font-bold">{(totalStats.distance / 1000).toFixed(1)} km</h4>
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
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="calories">Calorías</TabsTrigger>
              <TabsTrigger value="steps">Pasos</TabsTrigger>
              <TabsTrigger value="duration">Tiempo</TabsTrigger>
              <TabsTrigger value="distance">Distancia</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calories" className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDateAxis} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={formatTooltipDate}
                    formatter={(value: number) => [`${value} kcal`, 'Calorías']}
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
                    labelFormatter={formatTooltipDate}
                    formatter={(value: number) => [`${value.toLocaleString()} pasos`, 'Pasos']}
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
                    labelFormatter={formatTooltipDate}
                    formatter={(value: number) => [`${value} min`, 'Tiempo']}
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
                    labelFormatter={formatTooltipDate}
                    formatter={(value: number) => [`${value.toFixed(2)} km`, 'Distancia']}
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
                const categoryLogs = exerciseLogs.filter(log => {
                  const exercise = EXERCISES.find(e => e.id === log.exerciseId);
                  return exercise?.category === category;
                });

                return {
                  category: info.name,
                  calories: categoryLogs.reduce((sum, log) => sum + (log.calories || 0), 0),
                  minutos: categoryLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis yAxisId="left" orientation="left" stroke="#f97316" />
                <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="calories" fill="#f97316" name="Calorías" />
                <Bar yAxisId="right" dataKey="minutos" fill="#22c55e" name="Minutos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};