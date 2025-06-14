import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useDailySummary } from '../hooks/useDailySummary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DRINKS } from '@/features/water/types';
import { Gauge, CheckCircle, Droplet, ListChecks } from 'lucide-react';
import StatCard from './StatCard';

interface Props {
  date: Date;
}

export const DailySummary: React.FC<Props> = ({ date }) => {
  const { summary, loading, refetch } = useDailySummary(date);

  // Helper function to get drink name in Spanish
  const getDrinkName = (type: string) => {
    return DRINKS[type as keyof typeof DRINKS]?.name || type;
  };
  const chartData = [
    { name: 'Pomodoros', value: summary.pomodoro.count },
    { name: 'Tareas', value: summary.tasks.completed },
    { name: 'Hábitos', value: summary.habits.completed },
    { name: 'Negativos', value: summary.negativeHabits.count }
  ];

  const habitsPercent = summary.habits.total
    ? (summary.habits.completed / summary.habits.total) * 100
    : 0;
  const tasksPercent = summary.tasks.todayPlanned
    ? (summary.tasks.completed / summary.tasks.todayPlanned) * 100
    : 0;
  const hydrationGoal = 2000;
  const hydrationPercent = Math.min(100, (summary.water.intake / hydrationGoal) * 100);
  const generalScore = Math.round(
    (habitsPercent + tasksPercent + summary.pomodoro.completionRate) / 3
  );

  const hasData = Object.values(summary).some(moduleData =>
    Object.values(moduleData).some(v => typeof v === 'number' && v > 0)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resumen Diario</CardTitle>
        <Button size="sm" variant="outline" onClick={refetch} disabled={loading}>
          Recalcular
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Score General"
            value={`${generalScore}%`}
            progress={generalScore}
            icon={<Gauge className="w-5 h-5" />}
          />
          <StatCard
            title="Hábitos"
            value={`${summary.habits.completed}/${summary.habits.total}`}
            progress={habitsPercent}
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <StatCard
            title="Tareas Hoy"
            value={`${summary.tasks.completed}/${summary.tasks.todayPlanned}`}
            progress={tasksPercent}
            icon={<ListChecks className="w-5 h-5" />}
          />
          <StatCard
            title="Hidratación"
            value={`${summary.water.intake} ml`}
            progress={hydrationPercent}
            icon={<Droplet className="w-5 h-5" />}
          />
        </div>
        <div className="h-40">
          {loading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          )}        </div>
        {!loading && summary.water.drinkDetails && summary.water.drinkDetails.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Detalle de Bebidas</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">              {summary.water.drinkDetails.map((drink) => (
                <div key={drink.type} className="flex justify-between p-2 rounded bg-muted/50">
                  <span className="font-medium">{getDrinkName(drink.type)}</span>
                  <span>{drink.amount}ml ({drink.count}x)</span>
                </div>
              ))}
            </div>
          </div>        )}
        {!loading && summary.habits.incompletedByTimeOfDay && summary.habits.incompletedByTimeOfDay.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Hábitos Pendientes por Momento</h4>
            <div className="space-y-3">
              {summary.habits.incompletedByTimeOfDay.map((group) => (
                <div key={group.timeOfDay} className="border rounded p-2">
                  <h5 className="text-xs font-medium mb-1 capitalize text-gray-600">
                    {group.timeOfDay === 'morning' ? 'Mañana' : 
                     group.timeOfDay === 'afternoon' ? 'Tarde' : 
                     group.timeOfDay === 'night' ? 'Noche' : 'Cualquier momento'}
                  </h5>
                  <div className="grid grid-cols-1 gap-1">
                    {group.habits.map((habit) => (
                      <div key={habit.id} className="flex items-center gap-2 text-xs bg-red-50 p-1 rounded">
                        <span>{habit.icon}</span>
                        <span className="flex-1">{habit.name}</span>
                        <span className="text-gray-500 text-[10px]">{habit.goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!loading && !hasData && (
          <p className="text-center text-sm text-muted-foreground">
            No hay datos registrados para este día.
          </p>
        )}

        {/* Detalles de Estados de Ánimo */}
        {summary.mood.details && summary.mood.details.length > 0 && (
          <div className="border rounded p-3">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Estados de Ánimo del Día</h4>
            <div className="grid grid-cols-1 gap-2">
              {summary.mood.details.map((mood, index) => (
                <div key={index} className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
                  <span className="text-lg">{mood.emoji}</span>
                  <span className="flex-1">{mood.text}</span>
                  <span className="text-sm font-medium text-blue-600">{mood.value}/10</span>
                  <span className="text-gray-500 text-[10px]">{mood.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Promedio del día: {summary.mood.average}/10
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
