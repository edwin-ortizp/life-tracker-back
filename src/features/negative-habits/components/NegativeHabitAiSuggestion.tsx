import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bot, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { getAiConfig } from '@/config/ai';
import { fetchAiResponse } from '@/utils/ai';
import { NEGATIVE_HABITS, NegativeHabitLog } from '../types';
import { Textarea } from '@/components/ui/textarea';
import { countTokens } from '@/utils/tokens';

interface NegativeHabitAiSuggestionProps {
  habits: { [key: string]: NegativeHabitLog };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const nhConfig = getAiConfig('negativeHabit');
const provider = nhConfig?.provider ?? 'gemini';
const hasKey = provider === 'groq'
  ? Boolean(import.meta.env.VITE_GROQ_API_KEY)
  : Boolean(import.meta.env.VITE_GEMINI_API_KEY);

export const NegativeHabitAiSuggestion: React.FC<NegativeHabitAiSuggestionProps> = ({ habits, open: openProp, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [suggestion, setSuggestion] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const baseImpact = nhConfig?.prompts?.impact ??
    'Explica el impacto de mis hábitos negativos de acuerdo con mis registros.';
  const baseAction = nhConfig?.prompts?.action ??
    'Recomienda acciones para reducirlos cada vez que los registro.';

  useEffect(() => {
    if (open) {
      const summary = generateSummary();
      setPrompt(`${baseImpact}\n${baseAction}\n${summary}`);
    } else {
      setPrompt('');
      setSuggestion('');
    }
  }, [open, habits]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const generateSummary = () => {
    const counts: Record<number, number> = {};
    let minDate: string | null = null;
    let maxDate: string | null = null;

    Object.keys(habits).forEach(key => {
      const [idStr, date] = key.split('_');
      const num = parseInt(idStr, 10);
      counts[num] = (counts[num] || 0) + 1;
      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;
    });

    const dateInfo =
      minDate && maxDate ? `Datos del ${minDate} al ${maxDate}` : 'Sin registros';
    const lines = NEGATIVE_HABITS.map(h => `- ${h.name}: ${counts[h.id] || 0}`).join('\n');
    return `${dateInfo}\n${lines}`;
  };

  const getSuggestion = async () => {
    if (!hasKey) return;
    setLoading(true);
    try {
      const text = await fetchAiResponse('negativeHabit', prompt);
      setSuggestion(text);
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
          <DialogTitle>Sugerencias sobre hábitos negativos</DialogTitle>
          <DialogDescription>
            Impacto y acciones recomendadas.
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
          <Button onClick={getSuggestion} disabled={loading || !hasKey} className="w-full flex items-center justify-center gap-2">
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

export default NegativeHabitAiSuggestion;
