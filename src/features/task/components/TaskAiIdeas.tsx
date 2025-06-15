import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Bot } from 'lucide-react';
import { AiLoadingBar } from './AiLoadingBar';
import { getAiConfig } from '@/config/ai';
import { countTokens } from '@/utils/tokens';

interface TaskAiIdeasProps {
  title: string;
  description: string;
  onInsert: (text: string) => void;
}

const taskConfig = getAiConfig('task');
const API_URL = taskConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${taskConfig.model}:generateContent`
  : '';

export const TaskAiIdeas: React.FC<TaskAiIdeasProps> = ({ title, description, onInsert }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = taskConfig?.prompts?.ideas ??
    'Sugiere ejemplos o estrategias breves para abordar la tarea. Máximo 150 palabras.';
  const params = taskConfig?.params;

  useEffect(() => {
    if (open) {
      setPrompt(`${basePrompt}\nTítulo: ${title}\nDescripción: ${description}`);
    }
  }, [open, title, description]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const getIdeas = async () => {
    if (!apiKey || !title) return;
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
        <Bot className="w-4 h-4" /> Ideas
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Ideas para la tarea</DialogTitle>
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
            <Button onClick={getIdeas} disabled={loading || !apiKey} className="w-full">
              {loading ? 'Consultando...' : 'Obtener ideas'}
            </Button>
            {loading && <AiLoadingBar className="mt-2" />}
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

export default TaskAiIdeas;
