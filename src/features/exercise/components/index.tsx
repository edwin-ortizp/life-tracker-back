// src/features/exercise/components/index.tsx
import React, { useState } from 'react';
import { Plus, BarChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ExerciseProps } from '../types';
import { useExerciseData } from '../hooks/useExerciseData';
import { ExerciseList } from './ExerciseList';
import { ExerciseFormModal } from './ExerciseFormModal';
import { ExerciseStats } from './ExerciseStats';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export const Exercise: React.FC<ExerciseProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const {
    exerciseLogs,
    status,
    error,
    logExercise,
    updateExerciseLog,
    deleteExerciseLog
  } = useExerciseData(selectedDate);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tus ejercicios</p>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = (logId: string) => {
    const exerciseLog = exerciseLogs.find(log => log.id === logId);
    if (exerciseLog) {
      setEditingExercise(logId);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="list" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <BarChart className="w-4 h-4" />
                Estadísticas
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => setShowAddExercise(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar ejercicio
            </Button>
          </div>

          <TabsContent value="list" className="m-0">
            <ExerciseList
              exerciseLogs={exerciseLogs}
              onUpdate={handleEdit}
              onDelete={deleteExerciseLog}
              isLoading={status === 'loading'}
            />
          </TabsContent>

          <TabsContent value="stats" className="m-0">
            <ExerciseStats
              exerciseLogs={exerciseLogs}
              timeRange="month"
            />
          </TabsContent>
        </Tabs>

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}

        <ExerciseFormModal
          isOpen={showAddExercise}
          onClose={() => setShowAddExercise(false)}
          onSubmit={logExercise}
          selectedDate={selectedDate}
        />

        {editingExercise && (
          <ExerciseFormModal
            isOpen={true}
            onClose={() => setEditingExercise(null)}
            onSubmit={(data) => {
              updateExerciseLog(editingExercise, data);
              setEditingExercise(null);
            }}
            initialData={exerciseLogs.find(log => log.id === editingExercise)}
            selectedDate={selectedDate}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default Exercise;