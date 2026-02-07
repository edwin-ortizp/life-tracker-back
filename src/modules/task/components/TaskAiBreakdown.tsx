import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Bot, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { AiLoadingBar } from './AiLoadingBar';
import { getAiConfig } from '@/core/ai';
import { countTokens } from '@/shared/utils/tokens';

interface TaskAiBreakdownProps {
  title: string;
  description: string;
  onInsert: (text: string) => void;
}

const taskConfig = getAiConfig('task');
const API_URL = taskConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${taskConfig.model}:generateContent`
  : '';

export const TaskAiBreakdown: React.FC<TaskAiBreakdownProps> = ({ title, description, onInsert }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = taskConfig?.prompts?.breakdown ??
    'Desglosa la siguiente tarea en subtareas concretas y accionables:';
  const params = taskConfig?.params;

  useEffect(() => {
    if (open) {
      setPrompt(`${basePrompt}\nTarea: ${title}\nDescripcion: ${description}`);
    }
  }, [open, title, description]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const getBreakdown = async () => {
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

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Bot className="w-4 h-4" /> Subtareas IA
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] h-[90vh] max-w-none max-h-none overflow-hidden flex flex-col sm:w-[90vw] sm:h-[85vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl">Desglose de Tarea con IA</DialogTitle>
            <DialogDescription>
              La IA descompondrá tu tarea en subtareas concretas y accionables. Usa el panel izquierdo para editar el prompt y visualiza el resultado en el panel derecho.
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
                  placeholder="Escribe o modifica el prompt para la IA..."
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
                  onClick={getBreakdown} 
                  disabled={loading || !apiKey || tokenCount > 3500} 
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Bot className="w-4 h-4" />
                  {loading ? 'Consultando IA...' : 'Obtener subtareas'}
                </Button>
                
                {loading && <AiLoadingBar className="mt-2" />}
              </div>
            </div>
            
            {/* Columna derecha - Resultado */}
            <div className="flex-1 flex flex-col min-w-0 sm:border-l sm:border-gray-200 sm:pl-4 border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Resultado</h3>
                {suggestion && (
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(suggestion);
                      toast.success('Texto copiado al portapapeles');
                    }}
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                )}
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                <Textarea 
                  readOnly 
                  value={suggestion || (loading ? 'Generando subtareas...' : 'Las subtareas aparecerán aquí después de generar')} 
                  className="flex-1 resize-none bg-gray-50 border-gray-200 min-h-0"
                  placeholder="Las subtareas aparecerán aquí..."
                />
                
                {/* Botón de acción */}
                {suggestion && (
                  <div className="mt-3 flex-shrink-0">
                    <Button 
                      type="button" 
                      className="w-full" 
                      onClick={() => {
                        onInsert(suggestion);
                        toast.success('Subtareas insertadas en descripción');
                        setOpen(false);
                        setSuggestion('');
                      }}
                      variant="default"
                    >
                      📝 Insertar en descripción
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer con información adicional */}
          <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
              <span>💡 Tip: Describe tu tarea con detalle para obtener mejores subtareas</span>
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

export default TaskAiBreakdown;
