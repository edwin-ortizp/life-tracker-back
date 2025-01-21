import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { MealPlan } from '../types';

interface ImportMealPlanProps {
  onImport: (mealPlan: MealPlan) => Promise<void>;
  disabled?: boolean;
}

export const ImportMealPlan: React.FC<ImportMealPlanProps> = ({
  onImport,
  disabled
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const mealPlan = JSON.parse(content);
        
        // Validación básica del formato
        const isValid = Object.entries(mealPlan).every(([date, meals]: [string, any]) => {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(date)) return false;
          
          return Object.entries(meals).every(([type, meal]: [string, any]) => {
            return (
              ['breakfast', 'lunch', 'dinner'].includes(type) &&
              typeof meal.name === 'string' &&
              (!meal.notes || typeof meal.notes === 'string')
            );
          });
        });

        if (!isValid) {
          throw new Error('Formato de JSON inválido');
        }

        onImport(mealPlan);
      } catch (error) {
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
    </div>
  );
};