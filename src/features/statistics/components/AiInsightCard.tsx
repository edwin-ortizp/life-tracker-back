import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getAiConfig } from '@/config/ai';
import { fetchAiResponse } from '@/utils/ai';
import { DailySummaryData } from '../hooks/useDailySummary';
import { WeeklySummaryData } from '../hooks/useWeeklySummary';

interface Props {
  data: DailySummaryData | WeeklySummaryData | null;
  date: string;
}

// Helper function to determine if data is weekly summary
const isWeeklySummaryData = (data: any): data is WeeklySummaryData => {
  return data && 'daily' in data && 'totals' in data;
};

export const AiInsightCard: React.FC<Props> = ({ data, date }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  
  const aiConfig = getAiConfig('statistics');
  const provider = aiConfig?.provider ?? 'gemini';
  const hasKey = provider === 'groq'
    ? Boolean(import.meta.env.VITE_GROQ_API_KEY)
    : Boolean(import.meta.env.VITE_GEMINI_API_KEY);
  const basePrompt = aiConfig?.prompt ?? 'Analiza mis registros y dame consejos.';
  const params = aiConfig?.params;
  // Crear el summary a partir del objeto data
  const summary = data 
    ? (() => {
        if (isWeeklySummaryData(data)) {
          return `Fecha: ${date}\nDatos semanales:\n${JSON.stringify(data.totals, null, 2)}\n\nDetalle diario:\n${JSON.stringify(data.daily, null, 2)}`;
        } else {
          return `Fecha: ${date}\nDatos diarios:\n${JSON.stringify(data, null, 2)}`;
        }
      })()
    : `Fecha: ${date}\nNo hay datos disponibles.`;
  
  const disabled = !data;
  const fullPrompt = `${basePrompt}\n\n${summary}`;
  const handleAnalyze = async () => {
    if (!hasKey || !data) return;
    setLoading(true);
    const requestBody = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      ...params
    };
      console.log('🤖 AI Analysis Request:', {
      date,
      dataType: isWeeklySummaryData(data) ? 'weekly' : 'daily',
      dataKeys: data ? Object.keys(data) : [],
      promptLength: fullPrompt.length,
      requestBody
    });
    
    try {
      const text = await fetchAiResponse('statistics', fullPrompt);
      console.log('🤖 AI Response:', text);
      if (text) {
        setAnalysis(text);
        console.log('🤖 Analysis generated successfully');
      } else {
        setAnalysis('No se pudo generar análisis');
      }
    } catch (error) {
      console.error('🤖 API Error:', error);
      setAnalysis('Error al consultar la API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asistente IA</CardTitle>
      </CardHeader>      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button onClick={handleAnalyze} disabled={loading || !hasKey || disabled} className="flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Analizando...' : 'Analizar'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
          </Button>
        </div>
        
        {showDebug && (
          <div className="bg-gray-100 p-3 rounded text-xs space-y-2">
            <div><strong>Config:</strong> {aiConfig ? 'Encontrado' : 'No encontrado'}</div>
            <div><strong>Model:</strong> {aiConfig?.model || 'N/A'}</div>
            <div><strong>API Key:</strong> {hasKey ? '✓' : 'No configurado'}</div>
            <div><strong>Params:</strong> {JSON.stringify(params, null, 2)}</div>
            <div><strong>Prompt base:</strong></div>
            <div className="bg-white p-2 rounded max-h-32 overflow-y-auto">{basePrompt}</div>
            <div><strong>Summary data:</strong></div>
            <div className="bg-white p-2 rounded max-h-32 overflow-y-auto">{summary || 'Vacío'}</div>
            <div><strong>Prompt completo:</strong></div>
            <div className="bg-white p-2 rounded max-h-32 overflow-y-auto">{fullPrompt}</div>
          </div>
        )}
        
        {analysis && <div className="text-sm whitespace-pre-wrap">{analysis}</div>}
        {!analysis && disabled && (
          <p className="text-sm text-muted-foreground">
            Registra datos para generar un análisis.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
