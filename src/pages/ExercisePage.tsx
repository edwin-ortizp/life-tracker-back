// src/pages/ExercisePage.tsx
import React, { useState } from 'react';
import Exercise from '@/features/exercise/components';
import DateSelector from '@/components/DateSelector';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const ExercisePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

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
    <div className="container max-w-7xl mx-auto py-6">
      <DateSelector
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />
      
      <Exercise selectedDate={selectedDate} />
    </div>
  );
};

export default ExercisePage;