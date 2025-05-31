import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useWeeklyWaterStats } from '../hooks/useWeeklyWaterStats';
import { DRINKS, DRINK_CATEGORIES } from '../types';

interface WeeklyStatsProps {
  selectedDate: Date;
}

const COLORS = ['#60A5FA', '#34D399', '#A78BFA', '#F87171', '#FBBF24', '#A3E635'];

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({ selectedDate }) => {
  const { stats, loading, error } = useWeeklyWaterStats(selectedDate);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-red-500">Error al cargar estadísticas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico de consumo diario */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Consumo Diario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyIntake}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { weekday: 'short' })}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}ml`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}ml`, 'Consumo']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'short'
                  })}
                />
                <Bar dataKey="intake" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-500 text-center">
            Promedio diario: {Math.round(stats.avgDailyIntake)}ml
          </div>
        </CardContent>
      </Card>

      {/* Distribución por categoría */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Distribución por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryStats}
                  dataKey="totalAmount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category }) => DRINK_CATEGORIES[category as keyof typeof DRINK_CATEGORIES]}
                >
                  {stats.categoryStats.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}ml`, 'Cantidad']}
                  labelFormatter={(category) => DRINK_CATEGORIES[category as keyof typeof DRINK_CATEGORIES]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bebidas más consumidas */}
      <Card className="w-full md:col-span-2">
        <CardHeader>
          <CardTitle>Bebidas Más Consumidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {stats.commonDrinks.slice(0, 8).map(drink => {
              const drinkInfo = DRINKS[drink.type];
              const Icon = Icons[drinkInfo.icon as keyof typeof Icons] as React.ElementType;
              return (
                <div 
                  key={drink.type}
                  className="flex flex-col items-center p-4 rounded-lg bg-muted" // Changed bg-gray-50
                >
                  <Icon className={`w-6 h-6 ${drinkInfo.color} mb-2`} />
                  <span className="font-medium text-sm">{drinkInfo.name}</span>
                  <span className="text-sm text-gray-500 mt-1">
                    {drink.totalAmount}ml
                  </span>
                  <span className="text-xs text-gray-400">
                    {drink.count} veces
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};