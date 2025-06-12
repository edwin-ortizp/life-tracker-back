import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bot, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
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

  const generateSummary = () => {
    const counts: Record<number, number> = {};
    Object.entries(completedHabits).forEach(([key, value]) => {
      if (value) {
        const [id] = key.split('_');
        const num = parseInt(id, 10);
        counts[num] = (counts[num] || 0) + 1;
      }
    });
    return HABITS.map(h => `- ${h.name}: ${counts[h.id] || 0}`).join('\n');
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
          </Button>
          {suggestion && (
            <div className="p-4 bg-muted rounded-md prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(suggestion) }} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HabitAiSuggestion;
