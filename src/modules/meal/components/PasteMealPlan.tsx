import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { ClipboardPaste } from 'lucide-react';
import { MealPlan, MEAL_TYPES } from '../models';
import { useToast } from '@/shared/components/ui/use-toast';

interface PasteMealPlanProps {
  onImport: (mealPlan: MealPlan) => Promise<void>;
  disabled?: boolean;
}

export const PasteMealPlan: React.FC<PasteMealPlanProps> = ({ onImport, disabled }) => {
  const [open, setOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const { toast } = useToast();

  const validateMealPlan = (mealPlan: any): boolean => {
    if (!mealPlan || typeof mealPlan !== 'object') return false;

    return Object.entries(mealPlan).every(([date, meals]: [string, any]) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) return false;

      if (!meals || typeof meals !== 'object') return false;

      return Object.entries(meals).every(([type, meal]: [string, any]) => {
        if (!Object.keys(MEAL_TYPES).includes(type)) return false;
        if (!meal || typeof meal !== 'object') return false;
        if (typeof meal.name !== 'string' || !meal.name) return false;
        if (meal.notes && typeof meal.notes !== 'string') return false;
        if (meal.recipe && typeof meal.recipe !== 'string') return false;
        return true;
      });
    });
  };

  const handleImport = async () => {
    try {
      const mealPlan = JSON.parse(jsonText);
      if (!validateMealPlan(mealPlan)) {
        throw new Error('El formato del JSON no es válido. Revisa la documentación para ver el formato correcto.');
      }
      await onImport(mealPlan);
      setJsonText('');
      setOpen(false);
    } catch (error) {
      console.error('Error importing from text:', error);
      toast({
        title: 'Error de Importación',
        description: error instanceof Error ? error.message : 'Formato inválido',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <ClipboardPaste className="h-4 w-4 mr-2" />
        Pegar JSON
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pegar Plan de Comidas</DialogTitle>
        </DialogHeader>
        <Textarea
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          placeholder="Pegue aquí el JSON del plan de comidas"
          className="mt-4 min-h-[200px]"
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button type="button" onClick={handleImport} className="flex-1 sm:flex-none" disabled={!jsonText.trim()}>
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasteMealPlan;
