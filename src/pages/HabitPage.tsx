// src/pages/HabitPage.tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Habit } from '@/features/habit/components';
import DateSelector from '@/components/DateSelector';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { HABITS } from '@/features/habit/types';

const HabitPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habitStats, setHabitStats] = useState<any[]>([]);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const q = query(
      collection(db, 'habits'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(30)
    );

    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({
      date: doc.data().date,
      ...HABITS.reduce((acc, habit) => ({
        ...acc,
        [habit.name]: doc.data().habits?.[`${habit.id}_${doc.data().date}`] ? 1 : 0
      }), {})
    }));

    setHabitStats(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Hábitos</h1>
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
          <Habit selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Tendencias de Hábitos</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
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
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Resumen del Mes</h3>
                {/* Aquí irían estadísticas mensuales */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Configuración de Hábitos</h3>
              {/* Aquí iría la configuración de hábitos */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HabitPage;