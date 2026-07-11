import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useWaterStatsRange } from '../controllers/useWaterStatsRange';
import { useDrinkTypes } from '../controllers/useDrinkTypes';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

interface RangeStatsProps {
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export const RangeStats: React.FC<RangeStatsProps> = ({
  initialStartDate,
  initialEndDate
}) => {
  const [startDate, setStartDate] = useState(initialStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(initialEndDate || new Date());

  const { stats, loading } = useWaterStatsRange(startDate, endDate);
  const { getDrinkTypeByName } = useDrinkTypes();

  const handlePreviousPeriod = () => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    setStartDate(new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000));
    setEndDate(new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000));
  };

  const handleNextPeriod = () => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const newEndDate = new Date(endDate.getTime() + days * 24 * 60 * 60 * 1000);

    if (newEndDate <= new Date()) {
      setStartDate(new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000));
      setEndDate(newEndDate);
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Cargando...</CardContent></Card>;
  }

  // Prepare line chart data
  const lineChartData = stats.map(day => ({
    date: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    intake: day.intake / 1000 // Convert to liters
  }));

  // Prepare pie chart data for drink types
  const drinkTotals: Record<string, number> = {};
  stats.forEach(day => {
    Object.entries(day.drinks).forEach(([drink, amount]) => {
      drinkTotals[drink] = (drinkTotals[drink] || 0) + amount;
    });
  });

  const pieChartData = Object.entries(drinkTotals).map(([drink, amount]) => ({
    name: getDrinkTypeByName(drink)?.name || drink,
    value: amount / 1000
  }));

  const totalIntake = stats.reduce((sum, day) => sum + day.intake, 0);
  const avgDailyIntake = stats.length > 0 ? totalIntake / stats.length : 0;
  const maxDayIntake = Math.max(...stats.map(d => d.intake), 0);

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button onClick={handlePreviousPeriod} variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {startDate.toLocaleDateString('es-ES')} - {endDate.toLocaleDateString('es-ES')}
            </span>
            <Button
              onClick={handleNextPeriod}
              variant="outline"
              size="sm"
              disabled={endDate >= new Date()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{(totalIntake / 1000).toFixed(1)}L</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Promedio</p>
              <p className="text-2xl font-bold">{(avgDailyIntake / 1000).toFixed(1)}L</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Máximo</p>
              <p className="text-2xl font-bold">{(maxDayIntake / 1000).toFixed(1)}L</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia Diaria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Litros', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="intake" stroke="#3b82f6" name="Consumo (L)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie chart */}
      {pieChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Bebida</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}L`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
