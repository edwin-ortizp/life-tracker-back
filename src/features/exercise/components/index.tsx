// src/features/exercise/components/index.tsx
import { useState, useImperativeHandle, forwardRef } from 'react';
import { Plus, BarChart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ExerciseProps } from '../types';
import { useExerciseData } from '../hooks/useExerciseData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ExerciseList } from './ExerciseList';
import { ExerciseFormModal } from './ExerciseFormModal';
import { ExerciseStats } from './ExerciseStats';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export interface ExerciseRef {
  openAddExercise: () => void;
}

export const Exercise = forwardRef<ExerciseRef, ExerciseProps>(({ selectedDate }, ref) => {
  const { user } = useAuth();
  const {
    exerciseLogs,
    summary,
    status,
    error,
    logExercise,
    updateExerciseLog,
    deleteExerciseLog,
    resync
  } = useExerciseData(selectedDate);
  const { isOnline } = useNetworkStatus();

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    openAddExercise: () => setShowAddExercise(true)
  }));

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tus ejercicios</p>
        </CardContent>
      </Card>
    );
  }

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
              className="gap-2 hidden sm:flex"
              disabled={status === 'saving' || !isOnline}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Agregar</span>
            </Button>
          </div>

          <TabsContent value="list" className="m-0">
            <ExerciseList
              exerciseLogs={exerciseLogs}
              onUpdate={setEditingExerciseIndex}
              onDelete={deleteExerciseLog}
              isLoading={status === 'loading'}
            />
          </TabsContent>

          <TabsContent value="stats" className="m-0">
            <ExerciseStats
              exerciseLogs={exerciseLogs}
              summary={summary}
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

        {editingExerciseIndex !== null && (
          <ExerciseFormModal
            isOpen={true}
            onClose={() => setEditingExerciseIndex(null)}
            onSubmit={(data) => {
              updateExerciseLog(editingExerciseIndex, data);
              setEditingExerciseIndex(null);
            }}
            initialData={exerciseLogs[editingExerciseIndex]}
            selectedDate={selectedDate}
          />
        )}
      </CardContent>
      <CardFooter className="justify-center gap-2 text-xs p-2">
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
      </CardFooter>
    </Card>
  );
});

Exercise.displayName = 'Exercise';
// Re-export for easier imports
export * from './ExerciseCalendar';

export default Exercise;