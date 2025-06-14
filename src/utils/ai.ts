import { getAiConfig } from '@/config/ai';

export async function fetchAiResponse(module: string, prompt: string): Promise<string> {
  const config = getAiConfig(module);
  if (!config) return 'No se pudo obtener respuesta';
  const provider = config.provider ?? 'gemini';
  const params = config.params ?? {};

  if (provider === 'groq') {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
    if (!apiKey) return 'Falta la API key de Groq';
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: params.temperature,
        top_p: params.top_p
      })
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? 'No se pudo obtener respuesta';
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) return 'Falta la API key de Gemini';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      ...params
    })
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No se pudo obtener respuesta';
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_WHISPER_API_KEY as string | undefined;
  if (!apiKey) throw new Error('Falta la API key de Whisper');
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-1');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData
  });
  const data = await res.json();
  return data?.text ?? '';
}
