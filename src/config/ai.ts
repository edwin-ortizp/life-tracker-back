export interface AiParams {
  temperature?: number;
  top_p?: number;
}

export interface AiModuleConfig {
  model: string;
  /** Prompt genérico o por defecto */
  prompt?: string;
  /** Prompts específicos por acción */
  prompts?: Record<string, string>;
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
    prompts: {
      meal:
        'Genera una comida usando los ingredientes proporcionados. Devuelve solo JSON {"name":"","notes":"","recipe":""}.',
      day:
        'Genera todas las comidas del día. Devuelve JSON con las llaves breakfast, morningSnack, lunch, afternoonSnack y dinner, cada una con {"name":"","notes":"","recipe":""}.'
    }
  },
  mood: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Analiza la siguiente entrada del diario y sugiere estados de ánimo. Solo usa los que están en la lista proporcionada y devuelve el resultado en formato JSON: [{"emoji":"","text":"","time":"HH:mm","reason":""}]'
  },
  habit: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompts: {
      predict:
        'Analiza el historial reciente de hábitos. Predice cuáles podrían fallarse y ofrece consejos para cumplirlos.',
      suggest:
        'Sugiere nuevos hábitos basados en mis metas u otros módulos como tareas o salud.'
    }
  },
  negativeHabit: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompts: {
      impact:
        'Describe el impacto de cada hábito negativo según mis patrones recientes.',
      action:
        'Recomienda acciones cuando registre un hábito negativo.'
    }
  }
};

export const getAiConfig = (module: string): AiModuleConfig | undefined =>
  aiConfig[module];
