import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Bot } from 'lucide-react';
import { getAiConfig } from '@/config/ai';
import type { Task } from '../types';
import { AiLoadingBar } from './AiLoadingBar';
import { countTokens } from '@/utils/tokens';

interface TaskAiReprioritizeProps {
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Task>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const taskConfig = getAiConfig('task');
const API_URL = taskConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${taskConfig.model}:generateContent`
  : '';

export const TaskAiReprioritize: React.FC<TaskAiReprioritizeProps> = ({ tasks, onUpdate, open: openProp, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = taskConfig?.prompts?.reprioritize ??
    'Analiza la lista de tareas y devuelve un JSON con id, urgent, important, size y estimatedTime (minutos).';
  const params = taskConfig?.params;

  useEffect(() => {
    if (open) {
      const list = tasks
        .map(t => `- id:${t.id} title:${t.title} desc:${t.description || ''} priority:${t.priority || ''} size:${t.size || ''} time:${t.estimatedTime || ''}`)
        .join('\n');
      setPrompt(`${basePrompt}\n${list}`);
    }
  }, [open, tasks]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const handle = async () => {
    if (!apiKey || tasks.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], ...params })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setLog(text);
      const jsonMatch = text.match(/```json([\s\S]*?)```/);
      const raw = jsonMatch ? jsonMatch[1] : text;
      const updates = JSON.parse(raw);
      updates.forEach((u: any) => {
        const priority = u.urgent && u.important
          ? 'do'
          : u.important
          ? 'decide'
          : u.urgent
          ? 'delegate'
          : 'delete';
        onUpdate(u.id, {
          priority,
          size: u.size as Task['size'],
          estimatedTime: u.estimatedTime
        });
      });
    } catch (e) {
      setLog('Error al consultar la API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {openProp === undefined && (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Repriorizar
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Repriorizar tareas visibles</DialogTitle>
            <DialogDescription>La IA ajustará prioridad, tamaño y tiempo estimado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="max-h-[300px] overflow-y-auto" />
            <p className="text-xs text-right">
              Tokens: {tokenCount}
            </p>
            <Button onClick={handle} disabled={loading || !apiKey} className="w-full">
              {loading ? 'Analizando...' : 'Repriorizar' }
            </Button>
            {loading && <AiLoadingBar />}
            {log && (
              <pre className="text-xs bg-muted p-2 rounded max-h-48 overflow-auto whitespace-pre-wrap">{log}</pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskAiReprioritize;
