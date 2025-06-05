// features/meal/components/MealPlanner.tsx
import React, { useState } from 'react'; // Added useState
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WeeklyView from './WeeklyView';
import { ImportMealPlan } from './ImportMealPlan';
import { PasteMealPlan } from './PasteMealPlan';
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
    <div className="w-full h-full flex flex-col">
      {/* Header responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white border-b sticky top-0 z-10 gap-3">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg sm:text-xl font-bold">Plan de Comidas</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-500">Semanal</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto">
          <ImportMealPlan
            onImport={handleImportTrigger}
            disabled={status === 'saving'}
          />
          <PasteMealPlan
            onImport={handleImportTrigger}
            disabled={status === 'saving'}
          />
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
          <AlertDialogContent className="mx-4 max-w-sm sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Confirmar Importación</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                ¿Deseas sobrescribir el plan existente? Esto reemplazará todas las comidas existentes en las fechas importadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={() => setPendingMealPlan(null)} className="w-full sm:w-auto">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={executeImport} className="w-full sm:w-auto">
                Sobrescribir
              </AlertDialogAction>
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
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default MealPlanner;