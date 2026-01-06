import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog';
import { useMoodStates } from '@/features/mood/hooks/useMoodStates';
import type { Task } from '../types';
import { CATEGORY_LABELS } from '../types';
import { format } from 'date-fns';
import { Bot } from 'lucide-react';
import { AiLoadingBar } from './AiLoadingBar';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getAiConfig } from '@/config/ai';
import { Textarea } from '@/components/ui/textarea';
import { countTokens } from '@/utils/tokens';

interface TaskAiSuggestionProps {
  tasks: Task[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const taskConfig = getAiConfig('task');
const API_URL = taskConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${taskConfig.model}:generateContent`
  : '';

export const TaskAiSuggestion: React.FC<TaskAiSuggestionProps> = ({ tasks, open: openProp, onOpenChange }) => {
  const { moodStates } = useMoodStates();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [selectedMood, setSelectedMood] = useState<{ emoji: string; text: string } | null>(null);
  const { moodStates } = useMoodStates();
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = taskConfig?.prompt ??
    'Eres un asistente de productividad. Basándote en el estado de ánimo y las tareas pendientes sugiere cuál debería abordar primero.';
  const params = taskConfig?.params;

  useEffect(() => {
    if (selectedMood) {
      const tasksList = tasks
        .sort((a, b) => (a.startDate?.getTime() || Infinity) - (b.startDate?.getTime() || Infinity))
        .slice(0, 15)
        .map(t => `- ${t.title}${t.startDate ? ` (vence ${format(t.startDate, 'yyyy-MM-dd')})` : ''} - ${CATEGORY_LABELS[t.category]}`)
        .join('\n');
      setPrompt(`${basePrompt}\nEstado de ánimo: ${selectedMood.text}\nTareas pendientes:\n${tasksList}`);
    } else {
      setPrompt('');
    }
  }, [selectedMood, tasks]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  // Función para procesar la respuesta de la IA (Markdown -> HTML)
  const processAiResponse = (markdownText: string): string => {
    try {
      // Convertir Markdown a HTML (versión síncrona)
      const htmlContent = marked.parse(markdownText);
      // Sanitizar el HTML para seguridad
      return DOMPurify.sanitize(htmlContent as string);
    } catch (error) {
      console.error('Error procesando Markdown:', error);
      // Fallback: sanitizar el texto original
      return DOMPurify.sanitize(markdownText.replace(/\n/g, '<br>'));
    }
  };

  const getSuggestion = async () => {
    if (!apiKey || !selectedMood) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          ...params
        })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setSuggestion(text || 'No se pudo obtener sugerencia');
    } catch (e) {
      setSuggestion('Error al consultar la API');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setSuggestion('');
    setSelectedMood(null);
  };

  return (
    <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : closeDialog())}>
      {openProp === undefined && (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Sugerir tarea
        </Button>
      )}
      <DialogContent className="max-w-6xl h-[80vh]">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 min-h-0 overflow-hidden">
          {/* Columna izquierda - Configuración */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex flex-col space-y-4 mb-3">
              <div className="flex-shrink-0">
                <h2 className="text-lg font-medium mb-1">Sugerencia de tarea con IA</h2>
                <p className="text-sm text-muted-foreground mb-4">Selecciona tu estado de ánimo para recibir recomendaciones personalizadas</p>
              </div>
              
              {!selectedMood && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">¿Cómo te sientes?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {moodStates.map((mood) => (
                      <div key={mood.emoji} className="relative">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedMood({ emoji: mood.emoji, text: mood.text })}
                          className="h-12 text-lg w-full relative"
                        >
                          <span>{mood.emoji}</span>
                          <span className="w-full text-center text-xs text-gray-500 mt-1">
                            {mood.text}
                          </span>
                        </Button>
                      </div>
                    ))}
                    {moodStates.length === 0 && (
                      <div className="text-xs text-gray-500 col-span-3">
                        No hay estados de animo configurados.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedMood && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded-md">
                    <span>Estado de ánimo: <strong>{selectedMood.emoji} {selectedMood.text}</strong></span>
                  </div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Prompt para IA:</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 resize-none min-h-0"
                    placeholder="Modifica el prompt para personalizar la sugerencia..."
                  />
                </div>
              )}
            </div>
            
            {selectedMood && (
              <div className="flex flex-col gap-3 flex-shrink-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Tokens: {tokenCount}
                  </span>
                  {tokenCount > 3500 && (
                    <span className="text-red-500 font-medium">¡Prompt demasiado largo!</span>
                  )}
                </div>
                
                <Button 
                  onClick={getSuggestion} 
                  disabled={loading || !apiKey || tokenCount > 3500} 
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <Bot className="w-4 h-4" />
                  {loading ? 'Consultando IA...' : 'Generar sugerencia'}
                </Button>
                
                {loading && <AiLoadingBar className="mt-2" />}
              </div>
            )}
          </div>
          
          {/* Columna derecha - Resultado */}
          <div className="flex-1 flex flex-col min-w-0 sm:border-l sm:border-gray-200 sm:pl-4 border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Resultado</h3>
            {suggestion ? (
              <div className="flex-1 p-4 bg-muted rounded-md overflow-auto">
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert
                    prose-headings:text-foreground prose-p:text-foreground 
                    prose-strong:text-foreground prose-ul:text-foreground 
                    prose-ol:text-foreground prose-li:text-foreground
                    prose-code:bg-accent prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground
                    prose-pre:bg-accent prose-pre:border prose-pre:text-foreground
                    prose-blockquote:border-l-accent prose-blockquote:text-foreground"
                  dangerouslySetInnerHTML={{ __html: processAiResponse(suggestion) }} 
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                {selectedMood 
                  ? "Haz clic en 'Generar sugerencia' para obtener recomendaciones"
                  : "Selecciona tu estado de ánimo para comenzar"
                }
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
