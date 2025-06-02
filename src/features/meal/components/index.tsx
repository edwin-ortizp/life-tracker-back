// features/meal/components/MealPlanner.tsx
import React, { useState } from 'react'; // Added useState
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WeeklyView from './WeeklyView';
import { ImportMealPlan } from './ImportMealPlan';
import { useMealPlan } from '../hooks/useMealPlan';
import type { MealProps, MealPlan } from '../types'; // Added MealPlan type
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const MealPlanner: React.FC<MealProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingMealPlan, setPendingMealPlan] = useState<MealPlan | null>(null);

  const {
    mealPlan,
    status,
    error,
    addMeal,
    removeMeal,
    importMealPlan
  } = useMealPlan();

  const handleImportTrigger = async (newMealPlan: MealPlan): Promise<void> => {
    setPendingMealPlan(newMealPlan);
    setShowImportConfirm(true);
  };

  const executeImport = async () => {
    if (pendingMealPlan) {
      try {
        await importMealPlan(pendingMealPlan);
      } catch (err) { // Changed error to err to avoid conflict
        console.error('Error importing during confirmation:', err);
        toast({ title: "Error de Importación", description: "No se pudo importar el plan de comidas.", variant: "destructive" });
      } finally {
        setPendingMealPlan(null);
        setShowImportConfirm(false);
      }
    } else {
      setShowImportConfirm(false); // Ensure dialog closes if pendingMealPlan is null
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
    } catch (err) { // Changed error to err
      console.error('Error adding meal:', err);
      toast({ title: "Error al Agregar", description: "No se pudo agregar la comida.", variant: "destructive" });
    }
  };

  const handleRemoveMeal = async (...args: Parameters<typeof removeMeal>) => {
    try {
      await removeMeal(...args);
    } catch (err) { // Changed error to err
      console.error('Error removing meal:', err);
      toast({ title: "Error al Eliminar", description: "No se pudo eliminar la comida.", variant: "destructive" });
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
            onImport={handleImportTrigger}
            disabled={status === 'saving'} 
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100vh-80px)] overflow-auto">
        <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Importación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Deseas sobrescribir el plan existente? Esto reemplazará todas las comidas existentes en las fechas importadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingMealPlan(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={executeImport}>Sobrescribir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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