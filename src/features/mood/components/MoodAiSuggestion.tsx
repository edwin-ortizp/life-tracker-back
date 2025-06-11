import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Bot, Loader2 } from 'lucide-react';
import { getAiConfig } from '@/config/ai';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { getLocalDateString, createFormattedTimestamp } from '@/utils/dates';
import type { MoodEntry } from '../types';
import { MOODS } from '../types';
import { useJournalEntry } from '@/features/journal/context/JournalEntryContext';
import { useJournalLock } from '@/features/journal/context/JournalLockContext';
import DOMPurify from 'dompurify';
import { Textarea } from '@/components/ui/textarea';
import { countTokens } from '@/utils/tokens';

interface MoodAiSuggestionProps {
  selectedDate: Date;
}

interface Suggestion {
  emoji: string;
  text: string;
  time?: string;
  timeOfDay?: 'mañana' | 'tarde' | 'noche';
  reason?: string;
}

const moodConfig = getAiConfig('mood');
const API_URL = moodConfig
  ? `https://generativelanguage.googleapis.com/v1beta/models/${moodConfig.model}:generateContent`
  : '';

export const MoodAiSuggestion: React.FC<MoodAiSuggestionProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const { entry } = useJournalEntry();
  const { isUnlocked } = useJournalLock();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [prompt, setPrompt] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const moodList = MOODS.map(m => m.text).join(', ');
  const basePrompt =
    moodConfig?.prompt ??
    'Analiza la siguiente entrada del diario y sugiere estados de ánimo en formato JSON: [{"emoji":"","text":"","time":"HH:mm","reason":""}]';
  const params = moodConfig?.params;

  if (!isUnlocked) {
    return null;
  }

  useEffect(() => {
    if (open) {
      (async () => {
        const journalText = entry || (await fetchJournalEntry());
        setPrompt(
          `${basePrompt}\nMoods disponibles: ${moodList}. Solo usa estos valores.\n${journalText}`
        );
      })();
    }
  }, [open, entry]);

  useEffect(() => {
    setTokenCount(countTokens(prompt));
  }, [prompt]);

  const fetchJournalEntry = async (): Promise<string> => {
    if (!user) return '';
    const dateString = getLocalDateString(selectedDate);
    const ref = doc(db, 'journal', `${user.uid}_${dateString}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().text || '' : '';
  };

  const parseSuggestions = (text: string): Suggestion[] => {
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return [];
      const data = JSON.parse(match[0]) as Suggestion[];
      if (!Array.isArray(data)) return [];
      const allowed = new Set<string>(MOODS.map(m => m.text));
      const hourMap: Record<string, string> = {
        mañana: '09:00',
        tarde: '15:00',
        noche: '21:00'
      };
      const emojiMap = new Map(MOODS.map(m => [m.text, m.emoji]));
      return data
        .filter(s => allowed.has(s.text))
        .map(s => ({
          ...s,
          emoji:
            s.emoji ||
            emojiMap.get(s.text as (typeof MOODS)[number]['text']) ||
            '',
          time: s.time || hourMap[s.timeOfDay ?? ''] || '12:00'
        }));
    } catch {
      return [];
    }
  };

  const getSuggestions = async (p: string) => {
    if (!apiKey) return;
    setLoading(true);
    try {
      if (!p.trim()) {
        setSuggestions([]);
        return;
      }
      const res = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: p }] }],
          ...params
        })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseSuggestions(text);
      setSuggestions(parsed);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const saveSuggestion = async (s: Suggestion) => {
    if (!user) return;
    const dateString = getLocalDateString(selectedDate);
    const docId = `${user.uid}_${dateString}`;
    const moodRef = doc(collection(db, 'moods'), docId);

    let hour = 12;
    let minute = 0;
    if (s.time) {
      const [h, m] = s.time.split(':').map(Number);
      hour = h ?? 12;
      minute = m ?? 0;
    } else if (s.timeOfDay) {
      const hourMap: Record<string, number> = { mañana: 9, tarde: 15, noche: 21 };
      hour = hourMap[s.timeOfDay] ?? 12;
    }
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const formattedTimestamp = createFormattedTimestamp(selectedDate, hour, minute);

    const docSnap = await getDoc(moodRef);
    const existing = docSnap.exists() && Array.isArray(docSnap.data().moods) ? docSnap.data().moods : [];

    const moodItem = MOODS.find(
      m => m.text === (s.text as (typeof MOODS)[number]['text'])
    );
    const newMood: MoodEntry = {
      emoji: s.emoji || moodItem?.emoji || '',
      text: s.text,
      time: timeStr,
      timestamp: formattedTimestamp.timestamp
    };

    await setDoc(moodRef, {
      id: docId,
      userId: user.uid,
      date: dateString,
      moods: [...existing, newMood]
    });
  };

  const closeDialog = () => {
    setOpen(false);
    setSuggestions([]);
    setPrompt('');
    setTokenCount(0);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Bot className="h-4 w-4" />
        Analizar Diario
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sugerencias de estados de ánimo</DialogTitle>
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
          <Button
            onClick={() => getSuggestions(prompt)}
            disabled={loading || !apiKey}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Consultando...' : 'Analizar'}
          </Button>
          {loading && (
            <p className="flex items-center justify-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Consultando...
            </p>
          )}
          {!loading &&
            suggestions.map((s, idx) => (
              <div key={idx} className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.emoji}</span>
                  <span>{s.text}</span>
                  <span className="ml-auto text-sm text-gray-500">{s.time}</span>
                </div>
                {s.reason && (
                  <p
                    className="text-sm text-gray-500"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(s.reason) }}
                  />
                )}
                <Button size="sm" className="ml-auto" onClick={() => saveSuggestion(s)}>
                  Registrar
                </Button>
              </div>
            ))}
          {!loading && suggestions.length === 0 && (
            <p className="text-sm text-center text-gray-500">No se encontraron sugerencias</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoodAiSuggestion;
