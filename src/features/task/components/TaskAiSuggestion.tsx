import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

interface TaskAiSuggestionProps {
  tasks: Task[];
}

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const TaskAiSuggestion: React.FC<TaskAiSuggestionProps> = ({ tasks }) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | ''>('');
  const [selectedMood, setSelectedMood] = useState<{ emoji: string; text: string } | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = (import.meta.env.VITE_GEMINI_TASK_PROMPT as string | undefined) ??
    'Eres un asistente de productividad. Basándote en el estado de ánimo y las tareas pendientes sugiere cuál debería abordar primero.';

  const getSuggestion = async () => {
    if (!apiKey || !selectedMood || !selectedCategory) return;
    setLoading(true);
    try {
      const tasksList = tasks
        .filter(t => t.category === selectedCategory)
        .sort((a, b) => (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity))
        .slice(0, 10)
        .map(t => `- ${t.title}${t.dueDate ? ` (vence ${format(t.dueDate, 'yyyy-MM-dd')})` : ''}`)
        .join('\n');

      const prompt = `${basePrompt}\nEstado de ánimo: ${selectedMood.text}\nCategoría: ${CATEGORY_LABELS[selectedCategory]}\nTareas:\n${tasksList}`;

      const res = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
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
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Sugerir tarea
      </Button>
      <DialogContent className="w-full sm:max-w-3xl">
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
              <Button onClick={getSuggestion} disabled={loading || !apiKey} className="w-full flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Consultando...' : 'Obtener sugerencia'}
              </Button>
              {suggestion && (
                <p className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm">
                  {suggestion}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
