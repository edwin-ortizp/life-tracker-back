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

const HTML_INSTRUCTIONS =
  'Puedes usar etiquetas HTML básicas como <b>, <i> o <br> para dar formato a la respuesta.';

export const aiConfig: Record<string, AiModuleConfig> = {
  task: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Eres un asistente de productividad. Basándote en el estado de ánimo y las tareas pendientes sugiere cuál debería abordar primero. ' +
      HTML_INSTRUCTIONS
  },
  journal: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Reescribe el siguiente texto del diario de forma clara y natural. ' +
      HTML_INSTRUCTIONS
  },
  meal: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompts: {
      meal:
        'Genera una comida usando los ingredientes proporcionados. Devuelve solo JSON {"name":"","notes":"","recipe":""}. ' +
        HTML_INSTRUCTIONS,
      day:
        'Genera todas las comidas del día. Devuelve JSON con las llaves breakfast, morningSnack, lunch, afternoonSnack y dinner, cada una con {"name":"","notes":"","recipe":""}. ' +
        HTML_INSTRUCTIONS
    }
  },
  mood: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Analiza la siguiente entrada del diario y sugiere estados de ánimo. Solo usa los que están en la lista proporcionada y devuelve el resultado en formato JSON: [{"emoji":"","text":"","time":"HH:mm","reason":""}]. ' +
      HTML_INSTRUCTIONS
  },
  habit: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompts: {
      predict:
        'Analiza el historial de hábitos con fechas y conteos de éxitos y fallos. Indica qué hábitos son propensos a fallarse y por qué. Ofrece consejos concretos para cumplirlos. ' +
        HTML_INSTRUCTIONS,
      suggest:
        'Propón nuevos hábitos basados en mis metas y actividades de otros módulos como tareas o salud. Presenta la información en formato de lista. ' +
        HTML_INSTRUCTIONS
    }
  },
  negativeHabit: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompts: {
      impact:
        'Analiza mi historial de hábitos negativos con fechas y frecuencia. Describe el posible impacto de cada hábito y resalta patrones relevantes. ' +
        HTML_INSTRUCTIONS,
      action:
        'Cuando registre un hábito negativo, sugiere acciones o alternativas saludables para contrarrestarlo considerando mis tendencias previas. ' +
        HTML_INSTRUCTIONS
    }
  }
};

export const getAiConfig = (module: string): AiModuleConfig | undefined =>
  aiConfig[module];
