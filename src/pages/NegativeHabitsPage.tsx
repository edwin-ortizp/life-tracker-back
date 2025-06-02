// src/pages/NegativeHabitsPage.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNegativeHabitData } from '../features/negative-habits/hooks/useNegativeHabitData';
import { NegativeHabitToggle } from '../features/negative-habits/components/NegativeHabitToggle';
import { WeeklyView } from '../features/negative-habits/components/WeeklyView';
import { YearlyView } from '../features/negative-habits/components/YearlyView';
import { AddHabitModal } from '../features/negative-habits/components/AddHabitModal';
import DateSelector from '@/components/DateSelector';
import PageLayout from '@/components/PageLayout';
import { getLocalDateString } from '@/utils/dates';

const NegativeHabitsPage = () => {
  const [view, setView] = useState<'weekly' | 'yearly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const {
    habits,
    status,
    error,
    stats,
    logHabit,
    removeLog
  } = useNegativeHabitData();

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Hábitos Negativos</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar hábito
        </Button>
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
            <NegativeHabitToggle
              view={view}
              onViewChange={setView}
            />
          </div>

          {view === 'weekly' ? (
            <WeeklyView
              habits={habits}
              onLogHabit={logHabit}
              onRemoveLog={removeLog}
              disabled={status === 'saving'}
            />
          ) : (
            <YearlyView
              habits={habits}
              onLogHabit={logHabit}
              onRemoveLog={removeLog}
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