import { useState } from 'react';
import { Pomodoro } from '@/features/pomodoro/components';
import DateSelector from '@/components/DateSelector';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/hooks/useAuth';

export default function PomodoroPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Inicia sesión para ver tus estadísticas</h2>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pomodoro Timer</h1>
        <p className="text-gray-500">Gestiona tus sesiones de trabajo y productividad</p>
      </div>

      <DateSelector 
        selectedDate={selectedDate} 
        onChange={setSelectedDate}
      />

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Pomodoro selectedDate={selectedDate} />
        </div>
        <div className="space-y-6">
        </div>
      </div>
    </PageLayout>
  );
}