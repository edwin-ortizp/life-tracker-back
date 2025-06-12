import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getAiConfig } from '@/config/ai';

interface Props {
  summary: string;
}

export const AiInsightCard: React.FC<Props> = ({ summary }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const aiConfig = getAiConfig('statistics');
  const API_URL = aiConfig
    ? `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent`
    : '';
  const basePrompt = aiConfig?.prompt ?? 'Analiza mis registros y dame consejos.';
  const params = aiConfig?.params;

  const handleAnalyze = async () => {
    if (!apiKey || !API_URL) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${basePrompt}\n${summary}` }] }],
          ...params
        })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      setAnalysis(text);
    } catch {
      setAnalysis('Error al consultar la API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asistente IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAnalyze} disabled={loading || !apiKey} className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Analizando...' : 'Analizar'}
        </Button>
        {analysis && <div className="text-sm whitespace-pre-wrap">{analysis}</div>}
      </CardContent>
    </Card>
  );
};
