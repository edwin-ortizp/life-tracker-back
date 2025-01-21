import { useState } from 'react';
import { Pomodoro } from '@/features/pomodoro/components';
import { PomodoroStats } from '@/features/pomodoro/components';
import { PomodoroHistory } from '@/features/pomodoro/components/PomodoroHistory';
import { DailyProgress } from '@/features/pomodoro/components/DailyProgress';
import { usePomodoroData } from '@/features/pomodoro/hooks';
import DateSelector from '@/components/DateSelector';
import { useAuth } from '@/hooks/useAuth';

export default function PomodoroPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();
  const { sessions, deleteSession, editSession } = usePomodoroData(selectedDate);

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold">Inicia sesión para ver tus estadísticas</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pomodoro Timer</h1>
        <p className="text-gray-500">Gestiona tus sesiones de trabajo y productividad</p>
      </div>

      <DateSelector 
        selectedDate={selectedDate} 
        onChange={setSelectedDate}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <DailyProgress sessions={sessions} />
          <Pomodoro selectedDate={selectedDate} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Historial del Día</h2>
            </div>
            <div className="p-4">
              <PomodoroHistory 
                sessions={sessions}
                onDeleteSession={deleteSession}
                onEditSession={editSession}
              />
            </div>
          </div>
          
          <PomodoroStats dateRange="week" />
          <PomodoroStats dateRange="month" />
        </div>
      </div>
    </div>
  );
}