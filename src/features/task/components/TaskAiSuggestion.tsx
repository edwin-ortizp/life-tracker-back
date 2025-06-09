import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MoodSelector } from '@/features/mood/components';
import type { Task } from '../types';
import { format } from 'date-fns';

interface TaskAiSuggestionProps {
  tasks: Task[];
}

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const TaskAiSuggestion: React.FC<TaskAiSuggestionProps> = ({ tasks }) => {
  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<{emoji: string; text: string} | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = (import.meta.env.VITE_GEMINI_TASK_PROMPT as string | undefined) ??
    'Eres un asistente de productividad. Basándote en el estado de ánimo y las tareas pendientes sugiere cuál debería abordar primero.';

  const getSuggestion = async () => {
    if (!apiKey || !selectedMood) return;
    setLoading(true);
    try {
      const tasksList = tasks
        .sort((a, b) => (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity))
        .slice(0, 10)
        .map(t => `- ${t.title}${t.dueDate ? ` (vence ${format(t.dueDate, 'yyyy-MM-dd')})` : ''}`)
        .join('\n');

      const prompt = `${basePrompt}\nEstado de ánimo: ${selectedMood.text}\nTareas:\n${tasksList}`;

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
  };

  return (
    <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : closeDialog())}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Sugerir tarea
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sugerencia de tarea</DialogTitle>
          <DialogDescription>
            Indica cómo te sientes para recibir una recomendación
          </DialogDescription>
        </DialogHeader>
        {!selectedMood && (
          <MoodSelector onSelect={m => setSelectedMood(m)} />
        )}
        {selectedMood && (
          <div className="space-y-4">
            <p className="text-center text-sm">
              Estado de ánimo: {selectedMood.emoji} {selectedMood.text}
            </p>
            <Button onClick={getSuggestion} disabled={loading || !apiKey} className="w-full">
              {loading ? 'Consultando...' : 'Obtener sugerencia'}
            </Button>
            {suggestion && (
              <p className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm">
                {suggestion}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
