import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MoodSelector } from '@/features/mood/components';
import type { Task, TaskCategory } from '../types';
import { TASK_CATEGORIES, CATEGORY_LABELS } from '../types';
import { format } from 'date-fns';
import { Bot } from 'lucide-react';
import { AiLoadingBar } from './AiLoadingBar';
import DOMPurify from 'dompurify';
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
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | ''>('');
  const [selectedMood, setSelectedMood] = useState<{ emoji: string; text: string } | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = taskConfig?.prompt ??
    'Eres un asistente de productividad. Basándote en el estado de ánimo y las tareas pendientes sugiere cuál debería abordar primero.';
  const params = taskConfig?.params;

  useEffect(() => {
    if (selectedCategory && selectedMood) {
      const tasksList = tasks
        .filter(t => t.category === selectedCategory)
        .sort((a, b) => (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity))
        .slice(0, 10)
        .map(t => `- ${t.title}${t.dueDate ? ` (vence ${format(t.dueDate, 'yyyy-MM-dd')})` : ''}`)
        .join('\n');
      setPrompt(`${basePrompt}\nEstado de ánimo: ${selectedMood.text}\nCategoría: ${CATEGORY_LABELS[selectedCategory]}\nTareas:\n${tasksList}`);
    } else {
      setPrompt('');
    }
  }, [selectedCategory, selectedMood, tasks]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const getSuggestion = async () => {
    if (!apiKey || !selectedMood || !selectedCategory) return;
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
    setSelectedCategory('');
  };

  return (
    <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : closeDialog())}>
      {openProp === undefined && (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Sugerir tarea
        </Button>
      )}
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Sugerencia de tarea</DialogTitle>
          <DialogDescription>
            Selecciona una categoría y cómo te sientes para recibir una recomendación
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TaskCategory)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TASK_CATEGORIES).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCategory && !selectedMood && (
            <MoodSelector onSelect={(m) => setSelectedMood(m)} />
          )}

          {selectedCategory && selectedMood && (
            <div className="space-y-4">
              <p className="text-center text-sm">
                Estado de ánimo: {selectedMood.emoji} {selectedMood.text}
              </p>
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
              <Button onClick={getSuggestion} disabled={loading || !apiKey} className="w-full">
                {loading ? 'Consultando...' : 'Obtener sugerencia'}
              </Button>
              {loading && <AiLoadingBar className="mt-2" />}
              {suggestion && (
                <div className="p-4 bg-muted rounded-md prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(suggestion) }} />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
