import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/shared/components/ui/dialog';
import { Sparkles, RefreshCw, Loader2, Check, X } from 'lucide-react';
import { getAiConfig } from '@/core/ai';
import { useShoppingList } from '@/modules/shopping-list/controllers/useShoppingList.supabase';
import type { MealModalState, MealFormData } from './types';
import { MEAL_TYPES, Meal } from '../../models';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AiLoadingBar } from '@/modules/task/components';
import { countTokens } from '@/shared/utils/tokens';

interface MealAiButtonsProps {
  selectedMeal: MealModalState;
  onFormChange: (field: keyof MealFormData, value: string) => void;
  onOverwriteDay: (meals: Record<Meal['type'], Omit<Meal, 'id'>>) => Promise<void>;
  mealName?: string;
}

const mealConfig = getAiConfig('meal');
const API_URL = mealConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${mealConfig.model}:generateContent`
  : '';

export const MealAiButtons: React.FC<MealAiButtonsProps> = ({ selectedMeal, onFormChange, onOverwriteDay, mealName }) => {
  const { items } = useShoppingList();
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingCalories, setLoadingCalories] = useState(false);
  const [promptDialog, setPromptDialog] = useState<'meal' | 'day' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [preference, setPreference] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [generationType, setGenerationType] = useState<'meal' | 'day'>('meal');

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePromptMeal = mealConfig?.prompts?.meal ??
    'Genera una comida en formato JSON utilizando los ingredientes disponibles.';
  const basePromptDay = mealConfig?.prompts?.day ??
    'Genera todas las comidas del día en formato JSON.';
  const params = mealConfig?.params;

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const getIngredientList = () => {
    // Filtrar solo ingredientes alimentarios que estén en stock
    const foodItems = items.filter(item => {
      // Excluir productos de aseo y limpieza
      if (item.category) {
        const category = item.category.toLowerCase();
        const excludedCategories = ['aseo', 'limpieza', 'cuidado personal', 'otro'];
        if (excludedCategories.some(excluded => category.includes(excluded))) {
          return false;
        }
      }
      
      // Solo incluir items que estén en stock (excluir 'to-buy')
      return item.status === 'in-stock' || item.status === 'low-stock';
    });
    
    return foodItems.map(i => `${i.name} (${i.stock})`).join(', ');
  };

  const openDialog = (type: 'meal' | 'day') => {
    const ingredientList = getIngredientList();
    const pref = preference.trim();
    if (type === 'meal') {
      let p = `${basePromptMeal}\nDia: ${selectedMeal.date}\nTipo: ${selectedMeal.type}\nIngredientes: ${ingredientList}`;
      if (pref) {
        p += `\nPreferencias: ${pref}`;
      }
      p += '\nDevuelve JSON {"name":"","notes":"","recipe":""}';
      setPrompt(p);
    } else {
      let p = `${basePromptDay}\nDia completo: ${selectedMeal.date}\nIngredientes: ${ingredientList}`;
      if (pref) {
        p += `\nPreferencias: ${pref}`;
      }
      p += `\nDevuelve JSON con llaves ${Object.keys(MEAL_TYPES).join(', ')}.`;
      setPrompt(p);
    }
    setPromptDialog(type);
  };

  const closeDialog = () => {
    setPromptDialog(null);
    setPrompt('');
    setTokenCount(0);
    setShowPreview(false);
    setGeneratedData(null);
  };

  const confirmPrompt = async () => {
    if (promptDialog === 'meal') {
      setGenerationType('meal');
      await generateMealWithPreview(prompt);
    } else if (promptDialog === 'day') {
      setGenerationType('day');
      await generateDayWithPreview(prompt);
    }
    // NO cerrar el diálogo aquí - mantenerlo abierto para mostrar la previsualización
  };

  const generateMealWithPreview = async (p: string) => {
    if (!apiKey) return;
    setLoadingMeal(true);
    setShowPreview(true);
    setGeneratedData(null);
    
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
        setGeneratedData({
          name: json.name || '',
          notes: json.notes || '',
          recipe: json.recipe || '',
          type: selectedMeal.type
        });
      }
    } catch (e) {
      console.error('AI meal error', e);
      setGeneratedData(null);
    } finally {
      setLoadingMeal(false);
    }
  };

  const generateDayWithPreview = async (p: string) => {
    if (!apiKey) return;
    setLoadingDay(true);
    setShowPreview(true);
    setGeneratedData(null);
    
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
        setGeneratedData(json);
      }
    } catch (e) {
      console.error('AI day error', e);
      setGeneratedData(null);
    } finally {
      setLoadingDay(false);
    }
  };

  const handleInsertMeal = () => {
    if (!generatedData) return;

    if (generationType === 'meal') {
      // Validar que el nombre no esté vacío
      const name = (generatedData.name || '').trim();
      if (!name) {
        console.error('AI generated meal without name');
        return;
      }

      onFormChange('name', name);
      onFormChange('notes', generatedData.notes || '');
      onFormChange('recipe', generatedData.recipe || '');
    } else {
      const meals: Record<Meal['type'], Omit<Meal, 'id'>> = {} as any;
      (Object.keys(MEAL_TYPES) as Array<Meal['type']>).forEach(t => {
        if (generatedData[t]) {
          const name = (generatedData[t].name || '').trim();
          // Solo agregar comidas con nombre válido
          if (name) {
            meals[t] = {
              type: t,
              name: name,
              notes: generatedData[t].notes || '',
              recipe: generatedData[t].recipe || ''
            };
          }
        }
      });
      onOverwriteDay(meals);
    }

    // Cerrar el modal completamente después de insertar
    closeDialog();
  };

  const handleRegenerateFromPreview = () => {
    // Mantener el prompt actual y regenerar
    if (generationType === 'meal') {
      generateMealWithPreview(prompt);
    } else {
      generateDayWithPreview(prompt);
    }
  };

  const handleCancelPreview = () => {
    // Volver al estado de prompt sin cerrar el modal
    setShowPreview(false);
    setGeneratedData(null);
  };

  const estimateCalories = async () => {
    if (!mealName || !apiKey) return;
    
    setLoadingCalories(true);
    
    try {
      const prompt = `Estima las calorías aproximadas para una porción normal de: "${mealName}". Responde solo con el número de calorías, sin texto adicional ni explicaciones.`;
      
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
      
      // Extract number from response
      const caloriesMatch = text.match(/(\d+)/);
      if (caloriesMatch) {
        const calories = parseInt(caloriesMatch[1]);
        onFormChange('calories', calories.toString());
      }
    } catch (error) {
      console.error('Error estimating calories:', error);
    } finally {
      setLoadingCalories(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Preferencias (opcional)"
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          className="h-20"
        />
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
        {mealName && (
          <Button
            type="button"
            onClick={estimateCalories}
            disabled={loadingCalories || !apiKey || !mealName.trim()}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            {loadingCalories && <Loader2 className="w-4 h-4 animate-spin" />}<Sparkles className="w-4 h-4" /> Estimar calorías
          </Button>
        )}
        {(loadingMeal || loadingDay || loadingCalories) && <AiLoadingBar className="mt-2" />}
      </div>
      <Dialog open={promptDialog !== null} onOpenChange={(o) => (o ? null : closeDialog())}>
        <DialogContent className="w-[95vw] h-[90vh] max-w-none max-h-none overflow-hidden flex flex-col sm:w-[90vw] sm:h-[85vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl">
              {promptDialog === 'meal' ? 'Generar Comida con IA' : 'Regenerar Día Completo con IA'}
            </DialogTitle>
            <DialogDescription>
              {promptDialog === 'meal' 
                ? 'La IA generará una comida específica basada en tus ingredientes disponibles y preferencias.'
                : 'La IA generará un plan completo del día con todas las comidas basándose en tus ingredientes disponibles.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {/* Layout de dos columnas - responsivo */}
          <div className="flex-1 flex flex-col sm:flex-row gap-4 min-h-0 overflow-hidden">
            {/* Columna izquierda - Prompt */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 flex flex-col mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex-shrink-0">Prompt para IA</h3>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 resize-none min-h-0"
                  placeholder="Instrucciones para generar comidas..."
                />
              </div>
              
              <div className="flex flex-col gap-3 flex-shrink-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Tokens: {tokenCount}
                  </span>
                  {tokenCount > 3500 && (
                    <span className="text-red-500 font-medium">¡Prompt demasiado largo!</span>
                  )}
                </div>
                
                {!showPreview && (
                  <Button 
                    onClick={confirmPrompt} 
                    disabled={(promptDialog === 'meal' ? loadingMeal : loadingDay) || !apiKey || tokenCount > 3500} 
                    className="w-full flex items-center justify-center gap-2"
                    size="lg"
                  >
                    {(promptDialog === 'meal' ? loadingMeal : loadingDay) && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Sparkles className="w-4 h-4" />
                    {(promptDialog === 'meal' ? loadingMeal : loadingDay) ? 'Generando...' : 'Generar comidas'}
                  </Button>
                )}
                
                {(loadingMeal || loadingDay) && <AiLoadingBar className="mt-2" />}
              </div>
            </div>
            
            {/* Columna derecha - Resultado/Previsualización */}
            <div className="flex-1 flex flex-col min-w-0 sm:border-l sm:border-gray-200 sm:pl-4 border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  {showPreview ? 'Previsualización' : 'Información del proceso'}
                </h3>
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                {showPreview ? (
                  // Mostrar previsualización o estado de carga
                  <div className="flex-1 flex flex-col space-y-4">
                    <div className="flex-1 overflow-auto">
                      {(loadingMeal || loadingDay) && !generatedData ? (
                        // Estado de carga
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              Generando {generationType === 'meal' ? 'comida' : 'plan del día'}...
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              La IA está creando tu {generationType === 'meal' ? 'comida personalizada' : 'plan completo del día'}
                            </p>
                          </div>
                        </div>
                      ) : !generatedData ? (
                        // Error o sin datos
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                          <X className="w-8 h-8 text-red-500" />
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">Error al generar</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              No se pudo generar el contenido. Intenta nuevamente.
                            </p>
                          </div>
                        </div>
                      ) : generationType === 'meal' ? (
                        // Previsualización de comida individual
                        <Card className="h-full">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-blue-500" />
                              Comida Generada
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Nombre:</span>
                              <p className="text-sm mt-1">{generatedData.name || 'Sin nombre'}</p>
                            </div>
                            
                            {generatedData.notes && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Notas:</span>
                                <p className="text-sm mt-1 text-gray-600">{generatedData.notes}</p>
                              </div>
                            )}
                            
                            {generatedData.recipe && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Receta:</span>
                                <div className="text-sm mt-1 text-gray-600 bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap font-sans">{generatedData.recipe}</pre>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        // Previsualización de día completo
                        <div className="space-y-3">
                          {Object.keys(MEAL_TYPES).map(type => {
                            const mealData = generatedData[type];
                            if (!mealData) return null;
                            
                            return (
                              <Card key={type} className="border border-gray-200">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-blue-500" />
                                    {MEAL_TYPES[type as keyof typeof MEAL_TYPES]?.title}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Nombre:</span>
                                    <span className="ml-1">{mealData.name || 'Sin nombre'}</span>
                                  </div>
                                  {mealData.notes && (
                                    <div>
                                      <span className="font-medium">Notas:</span>
                                      <span className="ml-1 text-gray-600">{mealData.notes}</span>
                                    </div>
                                  )}
                                  {mealData.recipe && (
                                    <div>
                                      <span className="font-medium">Receta:</span>
                                      <div className="mt-1 text-gray-600 bg-gray-50 p-2 rounded text-xs max-h-16 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap font-sans">{mealData.recipe.substring(0, 100)}...</pre>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Botones de acción para la previsualización - solo mostrar si hay datos */}
                    {generatedData && (
                      <div className="flex flex-col gap-2 pt-3 border-t">
                        <Button
                          onClick={handleInsertMeal}
                          className="w-full gap-2"
                          size="sm"
                        >
                          <Check className="w-4 h-4" />
                          Insertar
                        </Button>
                        <Button
                          onClick={handleRegenerateFromPreview}
                          variant="secondary"
                          className="w-full gap-2"
                          size="sm"
                          disabled={loadingMeal || loadingDay}
                        >
                          {(loadingMeal || loadingDay) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Regenerar
                        </Button>
                        <Button
                          onClick={handleCancelPreview}
                          variant="outline"
                          className="w-full gap-2"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                    
                    {/* Botón de cancelar durante carga o error */}
                    {!generatedData && (
                      <div className="flex justify-center pt-3 border-t">
                        <Button
                          onClick={handleCancelPreview}
                          variant="outline"
                          className="gap-2"
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Mostrar información del proceso (estado original)
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-4 overflow-auto">
                    <div className="text-sm text-gray-700 space-y-3">
                      {promptDialog === 'meal' ? (
                        <>
                          <div>
                            <strong>Tipo de comida:</strong> {MEAL_TYPES[selectedMeal.type]?.title}
                          </div>
                          <div>
                            <strong>Fecha:</strong> {selectedMeal.date}
                          </div>
                          <div>
                            <strong>Ingredientes disponibles:</strong> {getIngredientList() || 'Ninguno disponible'}
                          </div>
                          {(loadingMeal || loadingDay) ? (
                            <div className="text-blue-600">✨ Generando comida personalizada...</div>
                          ) : (
                            <div className="text-gray-500">La comida se generará y podrás previsualizarla antes de insertarla.</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <strong>Fecha completa:</strong> {selectedMeal.date}
                          </div>
                          <div>
                            <strong>Comidas a generar:</strong> {Object.values(MEAL_TYPES).map(t => t.title).join(', ')}
                          </div>
                          <div>
                            <strong>Ingredientes disponibles:</strong> {getIngredientList() || 'Ninguno disponible'}
                          </div>
                          {(loadingMeal || loadingDay) ? (
                            <div className="text-blue-600">✨ Generando plan completo del día...</div>
                          ) : (
                            <div className="text-gray-500">Se generará el plan del día y podrás previsualizarlo antes de insertarlo.</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer con información adicional */}
          <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
              <span>💡 Tip: Mantén tu lista de compras actualizada para mejores sugerencias</span>
              {!apiKey && (
                <span className="text-red-500 font-medium">⚠️ API Key no configurada</span>
              )}
            </div>
            
            <DialogFooter className="flex justify-end gap-2 mt-3">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MealAiButtons;
