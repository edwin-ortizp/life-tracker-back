import { useState, useEffect } from 'react';
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
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { MOODS } from '@/features/mood/types';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

const JournalPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<any>({
    entries: [],
    moodStats: [],
    totalEntries: 0,
    averageWords: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, selectedDate]);

  const fetchStats = async () => {
    if (!user) return;

    // Obtener entradas del diario
    const journalQuery = query(
      collection(db, 'journal'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(30)
    );

    // Obtener estados de ánimo
    const moodQuery = query(
      collection(db, 'moods'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(30)
    );

    const [journalSnap, moodSnap] = await Promise.all([
      getDocs(journalQuery),
      getDocs(moodQuery)
    ]);

    const entries = journalSnap.docs.map(doc => {
      const data = doc.data();
      return {
        date: data.date,
        words: data.text?.split(/\s+/).length || 0,
        characters: data.text?.length || 0
      };
    });

    // Procesar estadísticas de estado de ánimo
    const moodCounts: Record<string, number> = {};
    moodSnap.docs.forEach(doc => {
      const data = doc.data();
      if (Array.isArray(data.moods)) {
        data.moods.forEach((mood: any) => {
          moodCounts[mood.text] = (moodCounts[mood.text] || 0) + 1;
        });
      }
    });

    const moodStats = Object.entries(moodCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setStats({
      entries,
      moodStats,
      totalEntries: entries.length,
      averageWords: Math.round(
        entries.reduce((acc, curr) => acc + curr.words, 0) / entries.length || 0
      )
    });
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