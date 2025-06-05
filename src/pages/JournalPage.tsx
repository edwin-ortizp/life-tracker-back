import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { JournalWithMood } from '@/features/journal/components/JournalWithMood';
import DateSelector from '@/components/DateSelector';
import PageLayout from '@/components/PageLayout';
import {
  BarChart,
  Bar,
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
import { startOfWeek, endOfWeek } from 'date-fns';
import { StatsPeriodSelector } from '@/features/journal/components/StatsPeriodSelector';
import { useJournalStatsRange } from '@/features/journal/hooks/useJournalStatsRange';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

const JournalPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState(endOfWeek(new Date()));
  const { user } = useAuth();
  const { stats, loading, error } = useJournalStatsRange(startDate, endDate);

  const handlePeriodChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Inicia sesión para acceder a tu diario</h2>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diario Personal</h1>
        <p className="text-gray-500">Escribe y reflexiona sobre tus experiencias diarias</p>
      </div>

      <DateSelector 
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />

      <Tabs defaultValue="entry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entry">Entrada Diaria</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-4">
          <JournalWithMood selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <StatsPeriodSelector onPeriodChange={handlePeriodChange} />
          {loading || !stats ? (
            <div className="p-4">Cargando estadísticas...</div>
          ) : error ? (
            <div className="p-4 text-red-500">Error al cargar estadísticas</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Actividad de Escritura</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.entries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="words" 
                        name="Palabras" 
                        fill="#8884d8" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Estados de Ánimo Frecuentes</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.moodStats}
                        nameKey="name"
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {stats.moodStats.map((entry: any, index: number) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Estadísticas Generales</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total de entradas</p>
                    <p className="text-2xl font-bold">{stats.totalEntries}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Promedio de palabras</p>
                    <p className="text-2xl font-bold">{stats.averageWords}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Sugerencias</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Escribe regularmente para mantener un mejor seguimiento de tus emociones</p>
                  <p>• Registra tu estado de ánimo junto con tus entradas del diario</p>
                  <p>• Revisa tus entradas anteriores para identificar patrones</p>
                  <p>• Usa las estadísticas para entender mejor tus hábitos de escritura</p>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Configuración del Diario</h3>
              {/* TODO: Agregar configuraciones */}
            </CardContent>          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default JournalPage;
