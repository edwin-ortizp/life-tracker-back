// src/pages/ExercisePage.tsx
import React, { useState, useRef } from 'react';
import Exercise from '@/features/exercise/components';

import DateSelector from '@/components/DateSelector';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';

// Define the ExerciseRef type with the openAddExercise method
type ExerciseRef = {
  openAddExercise: () => void;
};

const ExercisePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();
  const exerciseRef = useRef<ExerciseRef>(null);

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

      <DateSelector
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />
      
      <Exercise selectedDate={selectedDate} />
    </PageLayout>
  );
};

export default ExercisePage;