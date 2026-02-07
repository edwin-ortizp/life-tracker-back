import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/shared/components/ui/dialog';
import { Bot, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { AiLoadingBar } from '@/modules/task/components';
import { getAiConfig } from '@/core/ai';
import { Textarea } from '@/shared/components/ui/textarea';
import { countTokens } from '@/shared/utils/tokens';

interface JournalAiRewriteProps {
  entry: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onInsert?: (text: string) => void;
  onReplace?: (text: string) => void;
}

const journalConfig = getAiConfig('journal');
const API_URL = journalConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${journalConfig.model}:generateContent`
  : '';

export const JournalAiRewrite: React.FC<JournalAiRewriteProps> = ({ entry, open: openProp, onOpenChange, onInsert, onReplace }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [rewrite, setRewrite] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [tokenCount, setTokenCount] = useState(0);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = journalConfig?.prompt ??
    'Reescribe el siguiente texto del diario de forma clara y natural:';
  const params = journalConfig?.params;

  useEffect(() => {
    if (open) {
      setPrompt(`${basePrompt}\n${entry}`);
    }
  }, [open, entry]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const getRewrite = async () => {
    if (!apiKey || !entry) return;
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
      setRewrite(text || 'No se pudo obtener respuesta');
    } catch (e) {
      setRewrite('Error al consultar la API');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setRewrite('');
    setPrompt('');
    setTokenCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : closeDialog())}>
      {openProp === undefined && (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Mejorar entrada
        </Button>
      )}
      <DialogContent className="w-[95vw] h-[90vh] max-w-none max-h-none overflow-hidden flex flex-col sm:w-[90vw] sm:h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Reescribir Diario con IA</DialogTitle>
          <DialogDescription>
            Gemini transformará tu texto en un estilo más natural. Usa el panel izquierdo para editar el prompt y visualiza el resultado en el panel derecho.
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
                onClick={getRewrite} 
                disabled={loading || !apiKey || tokenCount > 3500} 
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Bot className="w-4 h-4" />
                {loading ? 'Consultando IA...' : 'Generar versión mejorada'}
              </Button>
              
              {loading && <AiLoadingBar className="mt-2" />}
            </div>
          </div>
          
          {/* Columna derecha - Resultado */}
          <div className="flex-1 flex flex-col min-w-0 sm:border-l sm:border-gray-200 sm:pl-4 border-t sm:border-t-0 border-gray-200 pt-4 sm:pt-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Resultado</h3>
              {rewrite && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(rewrite);
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
                value={rewrite || (loading ? 'Generando respuesta...' : 'El resultado aparecerá aquí después de generar')} 
                className="flex-1 resize-none bg-gray-50 border-gray-200 min-h-0"
                placeholder="El resultado aparecerá aquí..."
              />
              
              {/* Botones de acción */}
              {rewrite && (onInsert || onReplace) && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  {onInsert && (
                    <Button 
                      type="button" 
                      className="flex-1" 
                      onClick={() => {
                        onInsert(rewrite);
                        toast.success('Texto insertado');
                      }}
                      variant="default"
                    >
                      📝 Insertar en entrada
                    </Button>
                  )}
                  {onReplace && (
                    <Button 
                      type="button" 
                      className="flex-1" 
                      onClick={() => {
                        onReplace(rewrite);
                        toast.success('Texto reemplazado');
                      }}
                      variant="secondary"
                    >
                      🔄 Reemplazar entrada
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer con información adicional */}
        <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
            <span>💡 Tip: Puedes editar el prompt para obtener diferentes estilos de reescritura</span>
            {!apiKey && (
              <span className="text-red-500 font-medium">⚠️ API Key no configurada</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JournalAiRewrite;
