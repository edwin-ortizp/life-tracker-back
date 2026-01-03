// src/pages/ExercisePage.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Exercise } from '@/features/exercise/components';
import DateSelector from '@/components/DateSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import { useModuleSettings } from '@/hooks/useModuleSettings';

// Define the ExerciseRef type with the openAddExercise method
type ExerciseRef = {
  openAddExercise: () => void;
};

const ExercisePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();
  const exerciseRef = useRef<ExerciseRef>(null);
  
  // Memoize defaults to prevent re-renders
  const exerciseDefaults = useMemo(() => ({ dailyCalories: 500 }), []);
  const { settings, saveSettings } = useModuleSettings('exercise', exerciseDefaults);
  const [caloriesInput, setCaloriesInput] = useState(settings.dailyCalories);

  useEffect(() => {
    setCaloriesInput(settings.dailyCalories);
  }, [settings.dailyCalories]);

  const handleFloatingButtonClick = () => {
    exerciseRef.current?.openAddExercise();
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Inicia sesión</h2>
            <p className="text-gray-500">
              Necesitas iniciar sesión para registrar y ver tus ejercicios
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout
      showFloatingButton={true}
      onFloatingButtonClick={handleFloatingButtonClick}
      floatingButtonLabel="Agregar ejercicio"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro de Ejercicio</h1>
        <p className="text-gray-500">Registra y monitorea tus actividades físicas diarias</p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Registro Diario</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />
          <div className="grid gap-6 md:grid-cols-[1fr_300px] mt-4">
            <Exercise ref={exerciseRef} selectedDate={selectedDate} />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="calGoal">Calorías diarias objetivo</Label>
                <Input
                  id="calGoal"
                  type="number"
                  value={caloriesInput}
                  onChange={(e) => setCaloriesInput(Number(e.target.value))}
                />
              </div>
              <Button onClick={() => saveSettings({ dailyCalories: caloriesInput })}>
                Guardar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default ExercisePage;