import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { MealPlan, MEAL_TYPES } from '../types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportMealPlanProps {
  onImport: (mealPlan: MealPlan) => Promise<void>;
  disabled?: boolean;
}

export const ImportMealPlan: React.FC<ImportMealPlanProps> = ({
  onImport,
  disabled
}) => {
  const validateMealPlan = (mealPlan: any): boolean => {
    if (!mealPlan || typeof mealPlan !== 'object') return false;

    return Object.entries(mealPlan).every(([date, meals]: [string, any]) => {
      // Validar formato de fecha
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) return false;

      if (!meals || typeof meals !== 'object') return false;

      // Validar cada comida
      return Object.entries(meals).every(([type, meal]: [string, any]) => {
        // Verificar que el tipo de comida es válido
        if (!Object.keys(MEAL_TYPES).includes(type)) return false;

        // Verificar estructura de la comida
        if (!meal || typeof meal !== 'object') return false;
        if (typeof meal.name !== 'string' || !meal.name) return false;
        if (meal.notes && typeof meal.notes !== 'string') return false;
        if (meal.recipe && typeof meal.recipe !== 'string') return false;

        return true;
      });
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const mealPlan = JSON.parse(content);
        
        if (!validateMealPlan(mealPlan)) {
          throw new Error('El formato del archivo no es válido. Revisa la documentación para ver el formato correcto.');
        }

        await onImport(mealPlan);
      } catch (error) {
        console.error('Error importing:', error);
        alert('Error al importar el archivo: ' + (error instanceof Error ? error.message : 'Formato inválido'));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={disabled}
      >
        <Upload className="h-4 w-4 mr-2" />
        Importar Plan
      </Button>
      <Alert className="mt-2">
        <AlertDescription>
          El archivo debe ser un JSON con el formato especificado en la documentación
        </AlertDescription>
      </Alert>
    </div>
  );
};