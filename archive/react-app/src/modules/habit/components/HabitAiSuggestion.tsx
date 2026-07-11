import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Bot, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getAiConfig } from '@/core/ai';
import { HABITS } from '../models';
import { Textarea } from '@/shared/components/ui/textarea';
import { countTokens } from '@/shared/utils/tokens';

interface HabitAiSuggestionProps {
  completedHabits: { [key: string]: boolean };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const habitConfig = getAiConfig('habit');
const API_URL = habitConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${habitConfig.model}:generateContent`
  : '';

// Configurar marked para un renderizado seguro
marked.setOptions({
  breaks: true, // Convertir saltos de línea en <br>
  gfm: true, // GitHub Flavored Markdown
});

export const HabitAiSuggestion: React.FC<HabitAiSuggestionProps> = ({ completedHabits, open: openProp, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [suggestion, setSuggestion] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePredict = habitConfig?.prompts?.predict ??
    'Analiza mis hábitos recientes y predice cuáles pueden fallar. Dame consejos para cumplirlos.';
  const baseSuggest = habitConfig?.prompts?.suggest ??
    'Sugiere nuevos hábitos basados en mis intereses y actividades.';
  const params = habitConfig?.params;

  useEffect(() => {
    if (open) {
      const summary = generateSummary();
      setPrompt(`${basePredict}\n${baseSuggest}\n${summary}`);
    } else {
      setPrompt('');
      setSuggestion('');
    }
  }, [open, completedHabits]);

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

  const generateSummary = () => {
    const counts: Record<number, { success: number; fail: number }> = {};
    let minDate: string | null = null;
    let maxDate: string | null = null;
    const allDates = new Set<string>();

    // Primero, recopilar todas las fechas y éxitos
    Object.entries(completedHabits).forEach(([key, value]) => {
      const [idStr, date] = key.split('_');
      const id = parseInt(idStr, 10);
      allDates.add(date);
      
      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;
      
      // Solo contar los éxitos (value = true)
      if (value) {
        const entry = counts[id] || { success: 0, fail: 0 };
        entry.success += 1;
        counts[id] = entry;
      }
    });

    // Calcular fallos: para cada hábito, contar días donde no se ejecutó
    const sortedDates = Array.from(allDates).sort();
    HABITS.forEach(habit => {
      const entry = counts[habit.id] || { success: 0, fail: 0 };
        // Contar días donde este hábito no se completó
      sortedDates.forEach(date => {
        const key = `${habit.id}_${date}`;
        if (!completedHabits[key]) {
          entry.fail += 1;
        }
      });
      
      counts[habit.id] = entry;
    });

    const dateInfo =
      minDate && maxDate ? `Datos del ${minDate} al ${maxDate}` : 'Sin registros';
    const lines = HABITS.map(h => {
      const c = counts[h.id] || { success: 0, fail: 0 };
      return `- ${h.name}: completado ${c.success} veces, no ejecutado ${c.fail} veces`;
    }).join('\n');
    return `${dateInfo}\n${lines}`;
  };

  const getSuggestion = async () => {
    if (!apiKey) return;
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
    setPrompt('');
    setTokenCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : closeDialog())}>
      {openProp === undefined && (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Analizar hábitos
        </Button>
      )}
      <DialogContent className="w-[95vw] h-[90vh] max-w-none max-h-none overflow-hidden flex flex-col sm:w-[90vw] sm:h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Análisis de Hábitos con IA</DialogTitle>
          <DialogDescription>
            La IA analizará tus hábitos recientes, predecirá cuáles pueden fallar y te dará consejos personalizados. Usa el panel izquierdo para editar el prompt y visualiza el resultado en el panel derecho.
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
                placeholder="Datos de hábitos para analizar..."
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
              
              <Button 
                onClick={getSuggestion} 
                disabled={loading || !apiKey || tokenCount > 3500} 
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Bot className="w-4 h-4" />
                {loading ? 'Consultando IA...' : 'Obtener análisis'}
              </Button>
            </div>
          </div>
          
          {/* Columna derecha - Resultado */}
          <div className="flex-1 flex flex-col min-w-0 sm:border-l sm:border-gray-200 sm:pl-4 border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Análisis y sugerencias</h3>
              {suggestion && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(suggestion);
                    toast.success('Análisis copiado al portapapeles');
                  }}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              )}
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-4 overflow-auto">
                {suggestion ? (
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
                ) : loading ? (
                  <div className="text-sm text-gray-500">Analizando tus hábitos...</div>
                ) : (
                  <div className="text-sm text-gray-500">
                    El análisis de tus hábitos aparecerá aquí. La IA te dará predicciones sobre qué hábitos pueden fallar y consejos para cumplirlos mejor.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer con información adicional */}
        <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
            <span>💡 Tip: Mientras más datos tengas registrados, mejores serán las predicciones</span>
            {!apiKey && (
              <span className="text-red-500 font-medium">⚠️ API Key no configurada</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HabitAiSuggestion;
