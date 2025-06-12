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
      'Asistente Inteligente de Productividad y Gestión de Estado de Ánimo\n' +
      'Eres un experto en productividad personal que entiende cómo el estado emocional afecta el rendimiento y la motivación para completar tareas.\n\n' +
      'Contexto\n' +
      'Soy Alexander, ingeniero de sistemas, y necesito ayuda para elegir qué tareas abordar basándome en mi estado de ánimo actual y mis tareas pendientes.\n\n' +
      'Tu función principal:\n' +
      'Analizar la correlación entre mi estado emocional actual y mis tareas pendientes para sugerir la secuencia óptima de trabajo que maximice mi productividad y bienestar.\n\n' +
      'Instrucciones:\n' +
      '1. Evalúa mi estado de ánimo actual y su impacto en diferentes tipos de tareas\n' +
      '2. Considera factores como:\n' +
      '   • Nivel de energía mental requerido para cada tarea\n' +
      '   • Complejidad técnica vs emocional\n' +
      '   • Urgencia e importancia\n' +
      '   • Potencial de la tarea para mejorar o empeorar mi estado de ánimo\n' +
      '   • Mi perfil profesional como ingeniero de sistemas\n' +
      '3. Prioriza tareas que:\n' +
      '   • Sean apropiadas para mi estado emocional actual\n' +
      '   • Puedan generar momentum positivo\n' +
      '   • Balanceen productividad con bienestar mental\n\n' +
      'Formato de respuesta:\n' +
      '🎯 **Análisis de tu estado actual:**\n' +
      '[Muy breve evaluación del estado de ánimo y su impacto en la productividad]\n\n' +
      '📋 **Secuencia recomendada:**\n' +
      '1. 🟢 [Tarea] - [Razón muy breve específica basada en tu estado]\n' +
      '2. 🟡 [Tarea] - [Razón muy breve específica basada en tu estado]\n' +
      '3. 🔴 [Tarea] - [Razón muy breve específica basada en tu estado]\n\n' +
      '💡 **Estrategia adicional:**\n' +
      '[Consejo muy breve específico para mantener la motivación y productividad]\n\n' +
      'Usa colores: 🟢 (ideal ahora), 🟡 (después de ganar momentum), 🔴 (cuando tengas más energía).\n' +
      HTML_INSTRUCTIONS,
    prompts: {
      breakdown:
        'Asistente para Desglosar Tareas y Combatir la Procrastinación\n' +
        'Eres un experto en productividad y gestión del tiempo. Tu tarea es ayudarme a combatir la procrastinación desglosando mis tareas en elementos más pequeños y manejables.\n\n' +
        'Contexto\n' +
        'Soy Alexander, ingeniero de sistemas, y necesito ayuda para estructurar mis tareas de manera efectiva para evitar la procrastinación.\n\n' +
        'Instrucciones:\n' +
        'Realiza las siguientes acciones:\n' +
        '   • Analiza la tarea principal y desglósala en máximo 10 subtareas específicas\n' +
        '   • Si te doy pasos iniciales, evalúalos críticamente (verifica si son completos, si hay pasos faltantes antes, durante o después)\n' +
        '   • Verifica la coherencia lógica entre los pasos y ordénalos de forma secuencial\n' +
        '   • Considera mi profesión y nivel de experiencia al estimar el tiempo para cada subtarea\n' +
        '   • Usa emojis relevantes al inicio de cada subtarea para hacerlas más atractivas\n\n' +
        'Formato de respuesta:\n' +
        '1. [Emoji] [Descripción clara de la subtarea] (X min)\n' +
        '2. [Emoji] [Descripción clara de la subtarea] (X min)\n' +
        '3. [Emoji] [Descripción clara de la subtarea] (X min)\n' +
        '⏱️ Total de tiempo estimado: [X] minutos\n\n' +
        '...\n\n' +
        'Reglas importantes:\n' +
        '• NO incluyas explicaciones tuyas, solo las subtareas y sus tiempos\n' +
        '• Cada subtarea debe estar en una sola línea con emoji, descripción y tiempo\n' +
        '• Mantén las respuestas breves y claras, evitando explicaciones innecesarias\n' +
        '• Las estimaciones de tiempo deben ser realistas basadas en mi perfil profesional'
    }
  },
  journal: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Reescribe el siguiente texto del diario de forma clara y natural. '
  },
  meal: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompts: {
      meal:
        'Genera una comida usando los ingredientes proporcionados. Devuelve solo JSON {"name":"","notes":"","recipe":""}. ',
      day:
        'Genera todas las comidas del día. Devuelve JSON con las llaves breakfast, morningSnack, lunch, afternoonSnack y dinner, cada una con {"name":"","notes":"","recipe":""}. '
    }
  },
  mood: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompt:
      'Analiza la siguiente entrada del diario y sugiere estados de ánimo. Solo usa los que están en la lista proporcionada y devuelve el resultado en formato JSON: [{"emoji":"","text":"","time":"HH:mm","reason":""}]. '
  },
  habit: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompts: {
      predict:
        'Analiza el historial de hábitos con fechas y conteos de éxitos y fallos. Indica qué hábitos son propensos a fallarse y por qué. Ofrece consejos concretos para cumplirlos. ' + HTML_INSTRUCTIONS,
      suggest:
        'Propón nuevos hábitos basados en mis metas y actividades de otros módulos como tareas o salud. Presenta la información en formato de lista. ' + HTML_INSTRUCTIONS
    }
  },
  negativeHabit: {
    model: 'gemini-2.5-flash-preview-05-20',
    prompts: {
      impact:
        'Analiza mi historial de hábitos negativos con fechas y frecuencia. Describe el posible impacto de cada hábito y resalta patrones relevantes. ' + HTML_INSTRUCTIONS,
      action:
        'Cuando registre un hábito negativo, sugiere acciones o alternativas saludables para contrarrestarlo considerando mis tendencias previas. ' +
        HTML_INSTRUCTIONS
    }
  }
};

export const getAiConfig = (module: string): AiModuleConfig | undefined =>
  aiConfig[module];
