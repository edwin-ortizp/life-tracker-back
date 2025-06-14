import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2 } from 'lucide-react';
import { getAiConfig } from '@/config/ai';
import { fetchAiResponse } from '@/utils/ai';
import { countTokens } from '@/utils/tokens';

interface TaskAiBreakdownProps {
  title: string;
  description: string;
  onInsert: (text: string) => void;
}

const taskConfig = getAiConfig('task');
const provider = taskConfig?.provider ?? 'gemini';
const hasKey = provider === 'groq'
  ? Boolean(import.meta.env.VITE_GROQ_API_KEY)
  : Boolean(import.meta.env.VITE_GEMINI_API_KEY);

export const TaskAiBreakdown: React.FC<TaskAiBreakdownProps> = ({ title, description, onInsert }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  const basePrompt = taskConfig?.prompts?.breakdown ??
    'Desglosa la siguiente tarea en subtareas concretas y accionables:';

  useEffect(() => {
    if (open) {
      setPrompt(`${basePrompt}\nTarea: ${title}\nDescripcion: ${description}`);
    }
  }, [open, title, description]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const getBreakdown = async () => {
    if (!hasKey || !title) return;
    setLoading(true);
    try {
      const text = await fetchAiResponse('task', prompt);
      setSuggestion(text);
    } catch (e) {
      setSuggestion('Error al consultar la API');
    } finally {
      setLoading(false);
    }
  };

  const insert = () => {
    if (suggestion) {
      onInsert(suggestion);
      setOpen(false);
      setSuggestion('');
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Bot className="w-4 h-4" /> Subtareas IA
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Desglose de tarea</DialogTitle>
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
            <Button onClick={getBreakdown} disabled={loading || !hasKey} className="w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Consultando...' : 'Obtener subtareas'}
            </Button>
            {suggestion && (
              <div className="space-y-2">
                <Textarea readOnly value={suggestion} className="max-h-[300px]" />
                <Button type="button" onClick={insert} className="w-full">
                  Insertar en descripción
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskAiBreakdown;
