export interface AiParams {
  temperature?: number;
  top_p?: number;
}

export interface AiModuleConfig {
  model: string;
  prompt: string;
  params?: AiParams;
}

export const aiConfig: Record<string, AiModuleConfig> = {
  task: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Eres un asistente de productividad. Basándote en el estado de ánimo y las tareas pendientes sugiere cuál debería abordar primero.'
  },
  journal: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Reescribe el siguiente texto del diario de forma clara y natural:'
  },
  meal: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt: 'Sugiere comidas en formato JSON según los ingredientes disponibles.'
  },
  mood: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Analiza la siguiente entrada del diario y sugiere estados de ánimo con franja horaria (mañana, tarde o noche) en formato JSON: [{"emoji":"","text":"","timeOfDay":"","reason":""}]'
  }
};

export const getAiConfig = (module: string): AiModuleConfig | undefined =>
  aiConfig[module];
