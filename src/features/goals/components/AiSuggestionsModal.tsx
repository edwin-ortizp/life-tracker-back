import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { generateAiResponse } from '@/utils/ai';
import { aiConfig } from '@/config/ai';
import { countTokens } from '@/utils/tokens';
import { toast } from 'sonner';
import { AiLoadingBar } from '@/features/task/components';
import type { Goal } from '../types';

interface Props {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
}

export const AiSuggestionsModal = ({ goal, isOpen, onClose }: Props) => {
  const [suggestions, setSuggestions] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  useEffect(() => {
    if (isOpen) {
      // Preparar el contexto del objetivo
      const completedTasks = goal.tasks.filter(t => t.done).length;
      const totalTasks = goal.tasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const numericInfo = goal.numericGoal?.enabled 
        ? `\nMeta numérica: ${goal.numericGoal.currentValue.toLocaleString()} / ${goal.numericGoal.targetValue.toLocaleString()} ${goal.numericGoal.unit} (${Math.round((goal.numericGoal.currentValue / goal.numericGoal.targetValue) * 100)}% completado)`
        : '';

      const tasksInfo = goal.tasks.length > 0
        ? `\nTareas actuales:\n${goal.tasks.map((task, idx) => 
            `${idx + 1}. ${task.title} ${task.done ? '✓' : '○'}`
          ).join('\n')}`
        : '\nNo hay tareas definidas aún.';

      const entriesInfo = goal.entries.length > 0
        ? `\nAvances registrados:\n${goal.entries
            .slice(-5) // Solo los últimos 5 avances
            .map((entry, idx) => 
              `${idx + 1}. ${entry.text} ${entry.isMilestone ? '⭐' : ''} (${new Date(entry.date).toLocaleDateString()})`
            ).join('\n')}`
        : '\nNo hay avances registrados aún.';

      const context = `OBJETIVO: ${goal.title}
${goal.description ? `DESCRIPCIÓN: ${goal.description}` : ''}
ESTADO: ${goal.status}
PROGRESO DE TAREAS: ${progressPercentage}% (${completedTasks}/${totalTasks} completadas)${numericInfo}
FECHA LÍMITE: ${goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'No definida'}
${tasksInfo}
${entriesInfo}

Por favor, sugiere tareas específicas y accionables que me ayuden a avanzar hacia este objetivo. Considera el progreso actual y las tareas existentes para evitar duplicados.`;

      setPrompt(context);
    } else {
      setPrompt('');
      setSuggestions('');
      setError(null);
    }
  }, [isOpen, goal]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const generateSuggestions = async () => {
    if (!apiKey || !prompt) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const goalConfig = {
        ...aiConfig.goals,
        prompt: aiConfig.goals.prompts?.taskSuggestions
      };
      
      const response = await generateAiResponse(prompt, goalConfig, {
        temperature: aiConfig.goals.params?.temperature,
        topP: aiConfig.goals.params?.top_p,
      });
      setSuggestions(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar sugerencias');
      console.error('Error generating AI suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSuggestions('');
    setPrompt('');
    setError(null);
    setTokenCount(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={o => (o ? onClose() : handleClose())}>
      <DialogContent className="w-[95vw] h-[90vh] max-w-none max-h-none overflow-hidden flex flex-col sm:w-[90vw] sm:h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Sugerencias de IA para "{goal.title}"
          </DialogTitle>
          <DialogDescription>
            Obtén ideas inteligentes para tareas que te ayuden a completar tu objetivo
          </DialogDescription>
        </DialogHeader>

        {/* Goal Summary */}
        <Card className="flex-shrink-0">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Resumen del objetivo</h4>
                <Badge variant="secondary">
                  {goal.tasks.filter(t => t.done).length}/{goal.tasks.length} tareas
                </Badge>
              </div>
              {goal.description && (
                <p className="text-sm text-gray-600">{goal.description}</p>
              )}
              {goal.numericGoal?.enabled && (
                <p className="text-sm text-blue-600">
                  Meta: {goal.numericGoal.currentValue.toLocaleString()} / {goal.numericGoal.targetValue.toLocaleString()} {goal.numericGoal.unit}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Two-Column Layout */}
        <div className="flex-1 flex flex-col sm:flex-row gap-4 min-h-0 overflow-hidden">
          {/* Left Column - Prompt */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex flex-col mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex-shrink-0">Prompt para IA</h3>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 resize-none min-h-0"
                placeholder="Contexto del objetivo..."
              />
            </div>
            <div className="flex-shrink-0 space-y-3">
              <p className="text-xs text-right">
                Tokens: {tokenCount}{' '}
                {tokenCount > 3500 && (
                  <span className="text-red-500">¡Prompt demasiado largo!</span>
                )}
              </p>
              <Button 
                onClick={generateSuggestions} 
                disabled={isLoading || !apiKey || tokenCount > 3500} 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Sparkles className="h-4 w-4" />
                {isLoading ? 'Generando sugerencias...' : 'Generar sugerencias con IA'}
              </Button>
              {/* Loading Bar */}
              {isLoading && <AiLoadingBar className="mt-2" />}
            </div>
          </div>

          {/* Right Column - Result */}
          <div className="flex-1 flex flex-col min-w-0 sm:border-l sm:border-gray-200 sm:pl-4 border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0">
            <div className="mb-3 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Sugerencias de tareas
              </h3>
              {suggestions && (
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => {
                      navigator.clipboard.writeText(suggestions);
                      toast.success('Sugerencias copiadas');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateSuggestions}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerar
                  </Button>
                </div>
              )}
            </div>
            
            {/* Result Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {error ? (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="font-medium">Error:</span>
                      <span className="text-sm">{error}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={generateSuggestions}
                      className="mt-2"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reintentar
                    </Button>
                  </CardContent>
                </Card>
              ) : suggestions ? (
                <Textarea 
                  readOnly 
                  value={suggestions} 
                  className="flex-1 resize-none bg-gray-50 border-gray-200 min-h-0 whitespace-pre-wrap" 
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  Las sugerencias aparecerán aquí una vez generadas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 pt-4 flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};