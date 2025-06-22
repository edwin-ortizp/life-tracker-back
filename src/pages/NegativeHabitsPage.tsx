// src/pages/NegativeHabitsPage.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNegativeHabitData } from '../features/negative-habits/hooks/useNegativeHabitData';
import { NegativeHabitToggle } from '../features/negative-habits/components/NegativeHabitToggle';
import { WeeklyView } from '../features/negative-habits/components/WeeklyView';
import { YearlyView } from '../features/negative-habits/components/YearlyView';
import { AddHabitModal } from '../features/negative-habits/components/AddHabitModal';
import { NegativeHabitAiMenu } from '../features/negative-habits/components/NegativeHabitAiMenu';
import DateSelector from '@/components/DateSelector';
import PageLayout from '@/components/PageLayout';
import { getLocalDateString } from '@/utils/dates';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';

const NegativeHabitsPage = () => {
  const [view, setView] = useState<'weekly' | 'yearly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const {
    habits,
    status,
    error,
    logHabit,
    removeLog,
    resync
  } = useNegativeHabitData();
  const { isOnline } = useNetworkStatus();

  const handleLogHabit = async (habitId: number, note?: string) => {
    await logHabit(habitId, getLocalDateString(selectedDate), note);
    setIsModalOpen(false);
  };

  if (!user) {
    return (
      <PageLayout>
        <Card className="w-full">
          <CardContent className="p-4 text-center">
            <p>Inicia sesión para registrar tus hábitos negativos</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hábitos Negativos</h1>
        <p className="text-gray-500">Identifica y reduce comportamientos que quieres cambiar</p>
      </div>

      <DateSelector 
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />

      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h3 className="font-medium text-lg">Registro de Hábitos</h3>
              <p className="text-sm text-gray-500">
                Identifica y registra los hábitos que deseas cambiar
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NegativeHabitAiMenu habits={habits} />
              <NegativeHabitToggle view={view} onViewChange={setView} />
              <div className="flex items-center gap-2 text-xs">
                {status === 'saving' && (
                  <span className="text-blue-500">Guardando...</span>
                )}
                {status === 'pending' && (
                  <span className="text-yellow-600">Pendiente de sincronizar</span>
                )}
                {status === 'saved' && (
                  <span className="text-green-600">Sincronizado</span>
                )}
                {status === 'error' && (
                  <span className="text-red-600">Error de sincronización</span>
                )}
                {!isOnline && <span className="text-orange-600">Offline</span>}
                <Button onClick={resync} variant="link" className="p-0 h-auto">Reintentar</Button>
              </div>
            </div>
          </div>

          {view === 'weekly' ? (
            <WeeklyView
              habits={habits}
              onLogHabit={logHabit}
              onRemoveLog={removeLog}
              disabled={status === 'saving' || !isOnline}
            />
          ) : (
            <YearlyView
              habits={habits}
              onLogHabit={logHabit}
              onRemoveLog={removeLog}
              disabled={status === 'saving' || !isOnline}
            />
          )}

          {error && (
            <p className="mt-4 text-sm text-red-500">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <AddHabitModal
        isOpen={isModalOpen}        onClose={() => setIsModalOpen(false)}
        onLogHabit={handleLogHabit}
        selectedDate={selectedDate}
      />
    </PageLayout>
  );
};

export default NegativeHabitsPage;