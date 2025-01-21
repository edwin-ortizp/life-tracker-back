import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, AlertCircle } from 'lucide-react';
import { WeeklyView } from './WeeklyView';
import { ImportMealPlan } from './ImportMealPlan';
import { useMealPlan } from '../hooks/useMealPlan';
import type { MealProps } from '../types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const MealPlanner: React.FC<MealProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const {
    mealPlan,
    status,
    error,
    addMeal,
    removeMeal,
    importMealPlan
  } = useMealPlan();

  const handleImport = async (newMealPlan: typeof mealPlan) => {
    if (confirm('¿Deseas sobrescribir el plan existente? Esto reemplazará todas las comidas existentes en las fechas importadas.')) {
      try {
        await importMealPlan(newMealPlan);
      } catch (error) {
        console.error('Error importing:', error);
      }
    }
  };

  if (!user) {
    return (
      <Card className="w-full h-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para planificar tus comidas</p>
        </CardContent>
      </Card>
    );
  }

  const handleAddMeal = async (...args: Parameters<typeof addMeal>) => {
    try {
      await addMeal(...args);
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Error al agregar la comida');
    }
  };

  const handleRemoveMeal = async (...args: Parameters<typeof removeMeal>) => {
    try {
      await removeMeal(...args);
    } catch (error) {
      console.error('Error removing meal:', error);
      alert('Error al eliminar la comida');
    }
  };

  return (
    <Card className="w-full h-screen">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sticky top-0 bg-white z-10 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold">Plan de Comidas</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Semanal</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ImportMealPlan 
            onImport={handleImport} 
            disabled={status === 'saving'} 
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100vh-80px)] overflow-auto">
        <WeeklyView
          mealPlan={mealPlan}
          onAddMeal={handleAddMeal}
          onRemoveMeal={handleRemoveMeal}
          disabled={status === 'saving'}
          selectedDate={selectedDate}
        />

        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MealPlanner;