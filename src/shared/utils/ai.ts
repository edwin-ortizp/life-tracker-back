import { AiModuleConfig } from '@/core/ai';

interface GenerateAiResponseOptions {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export const generateAiResponse = async (
  prompt: string,
  config: AiModuleConfig,
  options?: GenerateAiResponseOptions
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY no está configurada');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;
  
  // Build the final prompt combining config and user prompt
  const finalPrompt = config.prompt ? `${config.prompt}\n\n${prompt}` : prompt;

  // Prepare request payload
  const requestPayload = {
    contents: [
      {
        parts: [
          {
            text: finalPrompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: options?.temperature ?? config.params?.temperature ?? 0.7,
      topP: options?.topP ?? config.params?.top_p ?? 0.8,
      maxOutputTokens: options?.maxOutputTokens ?? 4096,
      candidateCount: 1
    }
  };

  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Error en la API de Gemini (${response.status}): ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Respuesta inválida de la API de Gemini');
    }

    return data.candidates[0].content.parts[0].text.trim();
    
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Error inesperado al generar respuesta AI: ${String(error)}`);
  }
};