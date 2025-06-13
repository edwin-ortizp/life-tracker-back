import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bot, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getAiConfig } from '@/config/ai';
import { HABITS } from '../types';
import { Textarea } from '@/components/ui/textarea';
import { countTokens } from '@/utils/tokens';

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
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Sugerencias de hábitos</DialogTitle>
          <DialogDescription>
            Predicción de fallos y recomendaciones.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="max-h-[500px] overflow-y-auto"
          />
          <p className="text-xs text-right">
            Tokens: {tokenCount}{' '}
            {tokenCount > 3500 && (
              <span className="text-red-500">¡Prompt demasiado largo!</span>
            )}
          </p>
          <Button onClick={getSuggestion} disabled={loading || !apiKey} className="w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Consultando...' : 'Obtener sugerencia'}
          </Button>          {suggestion && (
            <div className="p-4 bg-muted rounded-md">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HabitAiSuggestion;
