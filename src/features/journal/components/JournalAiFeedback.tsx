import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';
import { getAiConfig } from '@/config/ai';
import { Textarea } from '@/components/ui/textarea';
import { countTokens } from '@/utils/tokens';
import { db } from '@/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import type { MoodEntry } from '@/features/mood/types';
import { Loader2 } from 'lucide-react';

interface JournalAiFeedbackProps {
  entry: string;
  selectedDate: Date;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const journalConfig = getAiConfig('journal');
const API_URL = journalConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${journalConfig.model}:generateContent`
  : '';

export const JournalAiFeedback: React.FC<JournalAiFeedbackProps> = ({ entry, selectedDate, open: openProp, onOpenChange }) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [feedback, setFeedback] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const basePrompt =
    'Analiza la siguiente entrada del diario y los estados de ánimo del día. Da una breve opinión sobre cómo fue y sugiere mejoras para mañana.';
  const params = journalConfig?.params;

  useEffect(() => {
    if (open) {
      (async () => {
        let moodText = '';
        if (user) {
          const dateString = getLocalDateString(selectedDate);
          const ref = doc(collection(db, 'moods'), `${user.uid}_${dateString}`);
          const snap = await getDoc(ref);
          const moods = (snap.exists() && Array.isArray(snap.data().moods) ? snap.data().moods : []) as MoodEntry[];
          moodText = moods.map(m => `${m.emoji} ${m.text}`).join(', ');
        }
        setPrompt(`${basePrompt}\nMoods: ${moodText}\nDiario:\n${entry}`);
      })();
    } else {
      setPrompt('');
      setFeedback('');
    }
  }, [open, entry, user, selectedDate]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const getFeedback = async () => {
    if (!apiKey || !prompt) return;
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
      setFeedback(text || 'No se pudo obtener respuesta');
    } catch (e) {
      setFeedback('Error al consultar la API');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setFeedback('');
    setPrompt('');
    setTokenCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : closeDialog())}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Opinión del día</DialogTitle>
          <DialogDescription>
            Resumen y sugerencias para mañana.
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
          <Button onClick={getFeedback} disabled={loading || !apiKey} className="w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Consultando...' : 'Analizar día'}
          </Button>
          {feedback && (
            <div className="p-4 bg-muted rounded-md prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(feedback) }} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JournalAiFeedback;
