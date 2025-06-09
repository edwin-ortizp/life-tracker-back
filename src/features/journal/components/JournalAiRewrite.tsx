import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Bot, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';

interface JournalAiRewriteProps {
  entry: string;
}

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

export const JournalAiRewrite: React.FC<JournalAiRewriteProps> = ({ entry }) => {
  const [open, setOpen] = useState(false);
  const [rewrite, setRewrite] = useState('');
  const [loading, setLoading] = useState(false);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt = (import.meta.env.VITE_GEMINI_JOURNAL_PROMPT as string | undefined) ??
    'Reescribe el siguiente texto del diario de forma clara y natural:';

  const getRewrite = async () => {
    if (!apiKey || !entry) return;
    setLoading(true);
    try {
      const prompt = `${basePrompt}\n${entry}`;
      const res = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
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
  };

  const sanitized = DOMPurify.sanitize(rewrite);

  return (
    <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : closeDialog())}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Bot className="w-4 h-4" />
        Mejorar entrada
      </Button>
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Reescribir Diario</DialogTitle>
          <DialogDescription>
            Gemini transformará tu texto en un estilo más natural.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={getRewrite} disabled={loading || !apiKey} className="w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Consultando...' : 'Generar versión mejorada'}
          </Button>
          {rewrite && (
            <div className="p-4 bg-muted rounded-md prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: sanitized }} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JournalAiRewrite;
