// src/pages/MoodPage.tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Mood } from '@/features/mood/components';
import DateSelector from '@/components/DateSelector';
import PageLayout from '@/components/PageLayout';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#FF0000'];

const MoodPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [moodDistribution] = useState<any[]>([]);

  return (
    <PageLayout>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Estado de Ánimo</h1>
      </div>

      <DateSelector 
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />

      <Tabs defaultValue="tracker" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracker">Registro Diario</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-4">
          <Mood selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Distribución de Estados de Ánimo</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          value,
                          index
                        }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = 25 + innerRadius + (outerRadius - innerRadius);
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#888"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                            >
                              {`${moodDistribution[index].name} (${value})`}
                            </text>
                          );
                        }}
                      >
                        {moodDistribution.map((index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Patrones y Tendencias</h3>
                {/* Aquí irían patrones identificados */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Configuración de Estados de Ánimo</h3>
              {/* Aquí irían las configuraciones */}
            </CardContent>
          </Card>        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default MoodPage;