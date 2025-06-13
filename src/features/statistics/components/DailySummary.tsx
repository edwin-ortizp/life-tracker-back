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
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Palabras Diario</p>
            <p className="font-bold">{summary.journal.words}</p>
          </div>          <div>
            <p className="text-sm text-muted-foreground">Hábitos</p>
            <p className="font-bold">{summary.habits.completed}/{summary.habits.total}</p>
            <p className="text-xs text-muted-foreground">
              {((summary.habits.completed / summary.habits.total) * 100).toFixed(0)}% completado
            </p>
          </div>          <div>
            <p className="text-sm text-muted-foreground">Ánimos</p>
            <p className="font-bold">{summary.mood.count}</p>
            {summary.mood.count > 0 && (
              <div className="text-xs text-muted-foreground">
                <div>Promedio: {summary.mood.average}/10</div>
                <div>Rango: {summary.mood.lowest}-{summary.mood.highest}</div>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Min Ejercicio</p>
            <p className="font-bold">{summary.exercise.minutes}</p>
          </div><div>
            <p className="text-sm text-muted-foreground">Hidratación (ml)</p>
            <p className="font-bold">{summary.water.intake}</p>
            {summary.water.drinkDetails && summary.water.drinkDetails.length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">                {summary.water.drinkDetails.slice(0, 2).map((drink) => (
                  <div key={drink.type}>
                    {getDrinkName(drink.type)}: {drink.amount}ml ({drink.count}x)
                  </div>
                ))}
                {summary.water.drinkDetails.length > 2 && (
                  <div>+{summary.water.drinkDetails.length - 2} más</div>
                )}
              </div>
            )}
          </div>
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
