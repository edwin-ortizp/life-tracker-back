import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { getAiConfig } from '@/config/ai';
import { useShoppingList } from '@/features/shopping-list/hooks/useShoppingList';
import type { MealModalState, MealFormData } from './types';
import { MEAL_TYPES, Meal } from '../../types';
import { Textarea } from '@/components/ui/textarea';
import { countTokens } from '@/utils/tokens';

interface MealAiButtonsProps {
  selectedMeal: MealModalState;
  onFormChange: (field: keyof MealFormData, value: string) => void;
  onOverwriteDay: (meals: Record<Meal['type'], Omit<Meal, 'id'>>) => Promise<void>;
}

const mealConfig = getAiConfig('meal');
const API_URL = mealConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${mealConfig.model}:generateContent`
  : '';

export const MealAiButtons: React.FC<MealAiButtonsProps> = ({ selectedMeal, onFormChange, onOverwriteDay }) => {
  const { items } = useShoppingList();
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [promptDialog, setPromptDialog] = useState<'meal' | 'day' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = mealConfig?.prompt ??
    'Sugiere comidas en formato JSON según los ingredientes disponibles.';
  const params = mealConfig?.params;

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const getIngredientList = () => {
    return items.map(i => `${i.name} (${i.quantity})`).join(', ');
  };

  const openDialog = (type: 'meal' | 'day') => {
    const ingredientList = getIngredientList();
    if (type === 'meal') {
      setPrompt(
        `${basePrompt}\nDia: ${selectedMeal.date}\nTipo: ${MEAL_TYPES[selectedMeal.type].title}\nIngredientes: ${ingredientList}\nDevuelve JSON {"name":"","notes":"","recipe":""}`
      );
    } else {
      setPrompt(
        `${basePrompt}\nDia completo: ${selectedMeal.date}\nIngredientes: ${ingredientList}\nDevuelve JSON con llaves ${Object.keys(MEAL_TYPES).join(', ')}.`
      );
    }
    setPromptDialog(type);
  };

  const closeDialog = () => {
    setPromptDialog(null);
    setPrompt('');
    setTokenCount(0);
  };

  const confirmPrompt = async () => {
    if (promptDialog === 'meal') {
      await regenerateMeal(prompt);
    } else if (promptDialog === 'day') {
      await regenerateDay(prompt);
    }
    closeDialog();
  };

  const regenerateMeal = async (p: string) => {
    if (!apiKey) return;
    setLoadingMeal(true);
    try {
      const prompt = p;
      const res = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          ...params
        })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        onFormChange('name', json.name || '');
        onFormChange('notes', json.notes || '');
        onFormChange('recipe', json.recipe || '');
      }
    } catch (e) {
      console.error('AI meal error', e);
    } finally {
      setLoadingMeal(false);
    }
  };

  const regenerateDay = async (p: string) => {
    if (!apiKey) return;
    setLoadingDay(true);
    try {
      const prompt = p;
      const res = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          ...params
        })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        const meals: Record<Meal['type'], Omit<Meal, 'id'>> = {} as any;
        (Object.keys(MEAL_TYPES) as Array<Meal['type']>).forEach(t => {
          if (json[t]) {
            meals[t] = {
              type: t,
              name: json[t].name || '',
              notes: json[t].notes || '',
              recipe: json[t].recipe || ''
            };
          }
        });
        await onOverwriteDay(meals);
      }
    } catch (e) {
      console.error('AI day error', e);
    } finally {
      setLoadingDay(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => openDialog('meal')}
          disabled={loadingMeal || !apiKey}
          variant="secondary"
          className="w-full flex items-center gap-2"
        >
          {loadingMeal && <Loader2 className="w-4 h-4 animate-spin" />}<Sparkles className="w-4 h-4" /> Generar comida
        </Button>
        <Button
          type="button"
          onClick={() => openDialog('day')}
          disabled={loadingDay || !apiKey}
          variant="ghost"
          className="w-full flex items-center gap-2"
        >
          {loadingDay && <Loader2 className="w-4 h-4 animate-spin" />}<RefreshCw className="w-4 h-4" /> Regenerar día
        </Button>
      </div>
      <Dialog open={promptDialog !== null} onOpenChange={(o) => (o ? null : closeDialog())}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Prompt</DialogTitle>
          </DialogHeader>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="max-h-[300px] overflow-y-auto"
          />
          <p className="text-xs text-right">
            Tokens: {tokenCount}{' '}
            {tokenCount > 3500 && (
              <span className="text-red-500">¡Prompt demasiado largo!</span>
            )}
          </p>
          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmPrompt}>
              Generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MealAiButtons;
