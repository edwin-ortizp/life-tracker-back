import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { useWeeklyWaterStats } from '../controllers/useWeeklyWaterStats';
import { useDrinkTypes } from '../controllers/useDrinkTypes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WeeklyStatsProps {
  selectedDate: Date;
}

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({ selectedDate }) => {
  const { stats, loading } = useWeeklyWaterStats(selectedDate);
  const { getDrinkTypeByName } = useDrinkTypes();

  if (loading) {
    return <Card><CardContent className="p-6">Cargando...</CardContent></Card>;
  }

  // Prepare data for chart
  const chartData = stats.map(day => {
    const entry: any = {
      date: new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' }),
      total: day.intake
    };

    // Add each drink type
    Object.entries(day.drinks).forEach(([drink, amount]) => {
      entry[drink] = amount;
    });

    return entry;
  });

  // Get unique drink types from all days
  const drinkTypes = Array.from(
    new Set(stats.flatMap(day => Object.keys(day.drinks)))
  );

  const totalWeekIntake = stats.reduce((sum, day) => sum + day.intake, 0);
  const avgDailyIntake = stats.length > 0 ? totalWeekIntake / 7 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas Semanales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Semanal</p>
            <p className="text-2xl font-bold">{(totalWeekIntake / 1000).toFixed(1)}L</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Promedio Diario</p>
            <p className="text-2xl font-bold">{(avgDailyIntake / 1000).toFixed(1)}L</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#3b82f6" name="Total" />
          </BarChart>
        </ResponsiveContainer>

        {/* Breakdown by drink type */}
        {drinkTypes.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-2">Desglose por Bebida</h4>
            <div className="space-y-2">
              {drinkTypes.map(drink => {
                const total = stats.reduce((sum, day) => sum + (day.drinks[drink] || 0), 0);
                const drinkInfo = getDrinkTypeByName(drink);

                return (
                  <div key={drink} className="flex items-center justify-between">
                    <span className="text-sm">{drinkInfo?.name || drink}</span>
                    <span className="text-sm font-medium">{(total / 1000).toFixed(1)}L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
