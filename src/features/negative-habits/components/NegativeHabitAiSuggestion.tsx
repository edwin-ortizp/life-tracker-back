import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Bot, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { getAiConfig } from '@/config/ai';
import { NEGATIVE_HABITS, NegativeHabitLog } from '../types';
import { Textarea } from '@/components/ui/textarea';
import { countTokens } from '@/utils/tokens';

interface NegativeHabitAiSuggestionProps {
  habits: { [key: string]: NegativeHabitLog };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const nhConfig = getAiConfig('negativeHabit');
const API_URL = nhConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${nhConfig.model}:generateContent`
  : '';

export const NegativeHabitAiSuggestion: React.FC<NegativeHabitAiSuggestionProps> = ({ habits, open: openProp, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [suggestion, setSuggestion] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const baseImpact = nhConfig?.prompts?.impact ??
    'Explica el impacto de mis hábitos negativos de acuerdo con mis registros.';
  const baseAction = nhConfig?.prompts?.action ??
    'Recomienda acciones para reducirlos cada vez que los registro.';
  const params = nhConfig?.params;

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
          <DialogTitle className="text-xl">Análisis de Hábitos Negativos con IA</DialogTitle>
          <DialogDescription>
            La IA analizará el impacto de tus hábitos negativos y te recomendará acciones específicas para reducirlos. Usa el panel izquierdo para editar el prompt y visualiza el resultado en el panel derecho.
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
                placeholder="Datos de hábitos negativos para analizar..."
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
              <h3 className="text-sm font-medium text-gray-700">Impacto y recomendaciones</h3>
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
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(suggestion.replace(/\n/g, '<br>')) }} 
                  />
                ) : loading ? (
                  <div className="text-sm text-gray-500">Analizando impacto de hábitos negativos...</div>
                ) : (
                  <div className="text-sm text-gray-500">
                    El análisis del impacto de tus hábitos negativos aparecerá aquí. La IA te dará recomendaciones específicas para reducir cada hábito.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer con información adicional */}
        <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
            <span>💡 Tip: Sé honesto con tus registros para obtener mejores recomendaciones</span>
            {!apiKey && (
              <span className="text-red-500 font-medium">⚠️ API Key no configurada</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NegativeHabitAiSuggestion;
