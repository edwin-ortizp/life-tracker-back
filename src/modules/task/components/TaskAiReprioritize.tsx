import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Bot, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getAiConfig } from '@/core/ai';
import type { Task } from '../models';
import { AiLoadingBar } from './AiLoadingBar';
import { countTokens } from '@/shared/utils/tokens';

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
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader className="flex-shrink-0 pb-1 space-y-0">
            <DialogTitle className="text-lg font-medium">Repriorizar Tareas con IA</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              La IA analizará tus tareas y ajustará automáticamente prioridad, tamaño y tiempo estimado.
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
                  placeholder="Lista de tareas a analizar..."
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
                  onClick={handle} 
                  disabled={loading || !apiKey || tokenCount > 3500} 
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Bot className="w-4 h-4" />
                  {loading ? 'Analizando...' : 'Repriorizar tareas'}
                </Button>
                
                {loading && <AiLoadingBar className="mt-2" />}
              </div>
            </div>
            
            {/* Columna derecha - Resultado */}
            <div className="flex-1 flex flex-col min-w-0 sm:border-l sm:border-gray-200 sm:pl-4 border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Resultado del análisis</h3>
                {log && (
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(log);
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
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto">
                  {log ? (
                    <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">{log}</pre>
                  ) : loading ? (
                    <div className="text-sm text-gray-500">Analizando tareas...</div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      El análisis y repriorizacion aparecerá aquí. Las tareas se actualizarán automáticamente una vez completado el análisis.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer con información adicional */}
          <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
              <span>💡 Tip: Las tareas se actualizarán automáticamente según la matriz de Eisenhower</span>
              {!apiKey && (
                <span className="text-red-500 font-medium">⚠️ API Key no configurada</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskAiReprioritize;
