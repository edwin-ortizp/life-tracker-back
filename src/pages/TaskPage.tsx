// src/pages/TaskPage.tsx
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Task } from '@/features/task/components';
import DateSelector from '@/components/DateSelector';
import PageLayout from '@/components/PageLayout';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TaskPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [taskStats, setTaskStats] = useState<any[]>([]);
  const [completionStats, setCompletionStats] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    // Obtener estadísticas de tareas completadas vs pendientes
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => doc.data());
    
    // Calcular estadísticas por día
    const dailyStats = tasks.reduce((acc: any, task) => {
      const date = task.createdAt?.toDate?.()?.toISOString?.().split('T')[0] || 'unknown';
      if (!acc[date]) {
        acc[date] = { date, completed: 0, pending: 0 };
      }
      acc[date][task.completed ? 'completed' : 'pending']++;
      return acc;
    }, {});

    setTaskStats(Object.values(dailyStats));

    // Calcular totales para el gráfico circular
    const totalCompleted = tasks.filter(task => task.completed).length;
    const totalPending = tasks.filter(task => !task.completed).length;

    setCompletionStats([
      { name: 'Completadas', value: totalCompleted },
      { name: 'Pendientes', value: totalPending }
    ]);
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Inicia sesión para ver tus tareas</h2>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestor de Tareas</h1>
        <p className="text-gray-500">Organiza y gestiona tus tareas pendientes y completadas</p>
      </div>

      <DateSelector 
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Tareas</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Task selectedDate={selectedDate} />
        </TabsContent>        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 desktop-grid-responsive">
            <Card className="desktop-card-enhanced">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Progreso de Tareas</h3>
                <div className="h-64 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={taskStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        name="Completadas"
                        stroke="#8884d8" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pending" 
                        name="Pendientes"
                        stroke="#82ca9d" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="desktop-card-enhanced">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Estado General</h3>
                <div className="h-64 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={completionStats}
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
                          percent,
                          name
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
                              {`${name} (${(percent * 100).toFixed(0)}%)`}
                            </text>
                          );
                        }}
                      >
                        {completionStats.map((index) => (
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
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Configuración de Tareas</h3>
              {/* Aquí irían las configuraciones */}
            </CardContent>          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default TaskPage;