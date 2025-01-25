import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Habit } from '@/features/habit/components';
import PageLayout from '@/components/PageLayout';
import DateSelector from '@/components/DateSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HABITS } from '@/features/habit/types';

const HabitPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habitStats] = useState<any[]>([]);

  return (
    <PageLayout>
          <DateSelector 
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
        
          <Tabs defaultValue="tracker">
            <TabsList>
              <TabsTrigger value="tracker">Registro Diario</TabsTrigger>
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
            </TabsList>

            <TabsContent value="tracker" >
              <div className="grid grid-cols-1">
                <Habit selectedDate={selectedDate} />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-4">Tendencias de Hábitos</h3>
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer>
                        <LineChart data={habitStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {HABITS.map(habit => (
                            <Line
                              key={habit.id}
                              type="monotone"
                              dataKey={habit.name}
                              name={`${habit.icon} ${habit.name}`}
                              stroke={`var(--${habit.name.toLowerCase()}-color)`}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-4">Resumen del Mes</h3>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
    </PageLayout>
  );
};

export default HabitPage;