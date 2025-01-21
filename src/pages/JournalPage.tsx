// src/pages/JournalPage.tsx
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Journal } from '@/features/journal/components';
import DateSelector from '@/components/DateSelector';
import {
  BarChart,
  Bar,
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

const JournalPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entryStats, setEntryStats] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const q = query(
      collection(db, 'journal'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(30)
    );

    const querySnapshot = await getDocs(q);
    const stats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        date: data.date,
        words: data.text?.split(/\s+/).length || 0,
        characters: data.text?.length || 0
      };
    });

    setEntryStats(stats);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Diario</h1>
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
          <Journal selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Actividad de Escritura</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={entryStats}>
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
                <h3 className="font-medium mb-4">Estadísticas del Mes</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total de entradas</p>
                    <p className="text-2xl font-bold">{entryStats.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Promedio de palabras</p>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        entryStats.reduce((acc, curr) => acc + curr.words, 0) / 
                        entryStats.length || 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4">Configuración del Diario</h3>
              {/* Aquí irían las configuraciones */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JournalPage;