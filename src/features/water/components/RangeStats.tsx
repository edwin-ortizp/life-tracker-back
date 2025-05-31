// src/features/water/components/RangeStats.tsx
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
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { DRINKS, DRINK_CATEGORIES } from '../types';
import { useWaterStatsRange } from '../hooks/useWaterStatsRange';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RangeStatsProps {
  startDate: Date;
  endDate: Date;
}

const COLORS = ['#60A5FA', '#34D399', '#A78BFA', '#F87171', '#FBBF24', '#A3E635'];

export const RangeStats: React.FC<RangeStatsProps> = ({ startDate, endDate }) => {
  const { stats, loading, error } = useWaterStatsRange(startDate, endDate);

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

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM', { locale: es });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Resumen del período */}
      <Card className="w-full md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Resumen del Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted"> {/* Changed bg-blue-50 */}
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(stats.summary.avgDailyIntake)}ml
              </div>
              <div className="text-sm text-gray-600">Promedio diario</div>
            </div>
            <div className="p-4 rounded-lg bg-muted"> {/* Changed bg-green-50 */}
              <div className="text-2xl font-bold text-green-600">
                {stats.summary.daysTracked}
              </div>
              <div className="text-sm text-gray-600">Días registrados</div>
            </div>
            <div className="p-4 rounded-lg bg-muted"> {/* Changed bg-purple-50 */}
              <div className="text-2xl font-bold text-purple-600">
                {stats.summary.daysWithGoal}
              </div>
              <div className="text-sm text-gray-600">Días meta alcanzada</div>
            </div>
            <div className="p-4 rounded-lg bg-muted"> {/* Changed bg-orange-50 */}
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(stats.summary.totalIntake / 1000)}L
              </div>
              <div className="text-sm text-gray-600">Total consumido</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de consumo diario */}
      <Card className="w-full md:col-span-2">
        <CardHeader>
          <CardTitle>Tendencia de Consumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={(value) => `${value}ml`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}ml`, 'Consumo']}
                  labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: es })}
                />
                <Line 
                  type="monotone" 
                  dataKey="intake" 
                  stroke="#60A5FA" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribución por categoría */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Distribución por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryStats}
                  dataKey="totalAmount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Top Bebidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.drinkStats.slice(0, 6).map(drink => {
              const drinkInfo = DRINKS[drink.type];
              const Icon = Icons[drinkInfo.icon as keyof typeof Icons] as React.ElementType;
              return (
                <div 
                  key={drink.type}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted" // Changed bg-gray-50
                >
                  <Icon className={`w-8 h-8 ${drinkInfo.color}`} />
                  <div className="flex-1">
                    <div className="font-medium">{drinkInfo.name}</div>
                    <div className="text-sm text-gray-500">
                      {Math.round(drink.totalAmount)}ml
                    </div>
                    <div className="text-xs text-gray-400">
                      {drink.count} veces ({Math.round(drink.percentage)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Promedios mensuales si están disponibles */}
      {stats.monthlyAverages && (
        <Card className="w-full md:col-span-2">
          <CardHeader>
            <CardTitle>Promedios Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return format(date, 'MMM yyyy', { locale: es });
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${Math.round(value)}ml`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${Math.round(value)}ml`, 'Promedio']}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return format(date, 'MMMM yyyy', { locale: es });
                    }}
                  />
                  <Bar dataKey="average" fill="#60A5FA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};