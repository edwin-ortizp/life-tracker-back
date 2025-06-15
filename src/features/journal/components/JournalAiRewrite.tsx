import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Bot, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { AiLoadingBar } from '@/features/task/components';
import { getAiConfig } from '@/config/ai';
import { Textarea } from '@/components/ui/textarea';
import { countTokens } from '@/utils/tokens';

interface JournalAiRewriteProps {
  entry: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onInsert?: (text: string) => void;
}

const journalConfig = getAiConfig('journal');
const API_URL = journalConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${journalConfig.model}:generateContent`
  : '';

export const JournalAiRewrite: React.FC<JournalAiRewriteProps> = ({ entry, open: openProp, onOpenChange, onInsert }) => {
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
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Reescribir Diario</DialogTitle>
          <DialogDescription>
            Gemini transformará tu texto en un estilo más natural.
          </DialogDescription>
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
          <Button onClick={getRewrite} disabled={loading || !apiKey} className="w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Consultando...' : 'Generar versión mejorada'}
          </Button>
          {loading && <AiLoadingBar className="mt-2" />}
          {rewrite && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <Button type="button" size="icon" variant="ghost" onClick={() => {
                  navigator.clipboard.writeText(rewrite);
                  toast.success('Texto copiado');
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <Textarea readOnly value={rewrite} className="max-h-[300px]" />
              {onInsert && (
                <Button type="button" className="w-full" onClick={() => onInsert(rewrite)}>
                  Insertar en entrada
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JournalAiRewrite;
