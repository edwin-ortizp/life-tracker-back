import { getLocalDateString, getDaysAgo } from '@/utils/dates';
import { getAiConfig } from '@/config/ai';
import { generateAiResponse } from '@/utils/ai';

// Types for data collection
interface DayData {
  date: string;
  habits: {
    completed: number;
    total: number;
    completedList: string[];
    missedList: string[];
  };
  mood: {
    average: number;
    entries: Array<{ time: string; mood: string; emoji: string }>;
  };
  exercise: {
    minutes: number;
    calories: number;
    types: string[];
  };
  water: {
    liters: number;
    entries: number;
  };
  tasks: {
    completed: number;
    pending: number;
    completedTitles: string[];
  };
  journal: {
    hasEntry: boolean;
    wordCount: number;
  };
}

interface WeeklyPattern {
  habitsPattern: string;
  moodPattern: string;
  exercisePattern: string;
  hydrationPattern: string;
  productivityPattern: string;
  weeklyTrends: string;
}

interface InsightResult {
  content: string;
  quickAction?: string;
}

// Data collectors (these would integrate with your existing hooks)
const collectDayData = async (date: Date): Promise<DayData> => {
  const dateStr = getLocalDateString(date);
  
  // This is a placeholder - you'll need to integrate with your actual data hooks
  // For now, returning mock data structure
  return {
    date: dateStr,
    habits: {
      completed: 0,
      total: 0,
      completedList: [],
      missedList: []
    },
    mood: {
      average: 0,
      entries: []
    },
    exercise: {
      minutes: 0,
      calories: 0,
      types: []
    },
    water: {
      liters: 0,
      entries: 0
    },
    tasks: {
      completed: 0,
      pending: 0,
      completedTitles: []
    },
    journal: {
      hasEntry: false,
      wordCount: 0
    }
  };
};

const analyzeWeeklyPatterns = (weekData: DayData[]): WeeklyPattern => {
  // Analyze habits pattern
  const habitCompletions = weekData.map(d => d.habits.completed / Math.max(d.habits.total, 1));
  const avgHabits = habitCompletions.reduce((a, b) => a + b, 0) / 7;
  const weekendHabits = (habitCompletions[5] + habitCompletions[6]) / 2; // Fri-Sat
  const weekdayHabits = habitCompletions.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  
  let habitsPattern = `Promedio semanal de hábitos: ${Math.round(avgHabits * 100)}%`;
  if (weekendHabits < weekdayHabits - 0.2) {
    habitsPattern += ", con notable bajón en fines de semana";
  } else if (weekendHabits > weekdayHabits + 0.1) {
    habitsPattern += ", mejor rendimiento en fines de semana";
  }

  // Analyze mood pattern
  const moodAvgs = weekData.map(d => d.mood.average).filter(m => m > 0);
  const avgMood = moodAvgs.length > 0 ? moodAvgs.reduce((a, b) => a + b, 0) / moodAvgs.length : 0;
  let moodPattern = `Estado de ánimo promedio: ${avgMood.toFixed(1)}/5`;
  
  const lowMoodDays = weekData
    .map((d, i) => ({ day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i], mood: d.mood.average }))
    .filter(d => d.mood > 0 && d.mood < 3)
    .map(d => d.day);
  
  if (lowMoodDays.length > 0) {
    moodPattern += `, días difíciles: ${lowMoodDays.join(', ')}`;
  }

  // Analyze exercise pattern
  const exerciseMinutes = weekData.map(d => d.exercise.minutes);
  const totalExercise = exerciseMinutes.reduce((a, b) => a + b, 0);
  const exerciseDays = exerciseMinutes.filter(m => m > 0).length;
  
  let exercisePattern = `${exerciseDays}/7 días con ejercicio (${totalExercise} min total)`;
  if (exerciseDays >= 5) {
    exercisePattern += " - excelente consistencia";
  } else if (exerciseDays >= 3) {
    exercisePattern += " - buen ritmo";
  } else if (exerciseDays > 0) {
    exercisePattern += " - necesita más consistencia";
  } else {
    exercisePattern += " - semana sedentaria";
  }

  // Analyze hydration
  const waterLiters = weekData.map(d => d.water.liters);
  const avgWater = waterLiters.reduce((a, b) => a + b, 0) / 7;
  
  let hydrationPattern = `Hidratación promedio: ${avgWater.toFixed(1)}L/día`;
  if (avgWater < 1.5) {
    hydrationPattern += " - crítica, muy por debajo de la meta (2.5L)";
  } else if (avgWater < 2.0) {
    hydrationPattern += " - insuficiente, necesita mejorar";
  } else if (avgWater >= 2.5) {
    hydrationPattern += " - excelente, cumpliendo meta";
  } else {
    hydrationPattern += " - mejorando, cerca de la meta";
  }

  // Analyze productivity
  const taskCompletions = weekData.map(d => d.tasks.completed);
  const totalTasks = taskCompletions.reduce((a, b) => a + b, 0);
  const avgTasks = totalTasks / 7;
  
  let productivityPattern = `Productividad: ${avgTasks.toFixed(1)} tareas/día promedio`;
  const mostProductiveDays = weekData
    .map((d, i) => ({ day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i], tasks: d.tasks.completed }))
    .filter(d => d.tasks >= Math.max(avgTasks * 1.2, 5))
    .map(d => d.day);
  
  if (mostProductiveDays.length > 0) {
    productivityPattern += `, mejores días: ${mostProductiveDays.join(', ')}`;
  }

  // Overall trends
  const recentDays = weekData.slice(-3); // Last 3 days
  const olderDays = weekData.slice(0, 4); // First 4 days
  
  const recentHabits = recentDays.reduce((sum, d) => sum + (d.habits.completed / Math.max(d.habits.total, 1)), 0) / 3;
  const olderHabits = olderDays.reduce((sum, d) => sum + (d.habits.completed / Math.max(d.habits.total, 1)), 0) / 4;
  
  let weeklyTrends = "";
  if (recentHabits > olderHabits + 0.1) {
    weeklyTrends = "Tendencia positiva: mejorando durante la semana";
  } else if (recentHabits < olderHabits - 0.1) {
    weeklyTrends = "Tendencia descendente: perdiendo momentum";
  } else {
    weeklyTrends = "Tendencia estable durante la semana";
  }

  return {
    habitsPattern,
    moodPattern,
    exercisePattern,
    hydrationPattern,
    productivityPattern,
    weeklyTrends
  };
};

const buildContextualPrompt = (targetDate: Date, weeklyPattern: WeeklyPattern): string => {
  const today = new Date();
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const dayName = dayNames[targetDate.getDay()];
  const hour = today.getHours();
  
  let timeContext = "";
  if (hour >= 5 && hour < 12) {
    timeContext = "Es temprano en la mañana, momento ideal para establecer el tono del día.";
  } else if (hour >= 12 && hour < 18) {
    timeContext = "Es medio día, buen momento para ajustar el curso del día.";
  } else {
    timeContext = "Es tarde, momento de reflexionar y planificar.";
  }

  return `
### CONTEXTO PERSONAL
Alexander, ingeniero de sistemas de 31 años, trabaja desde casa. 
Se levanta a las 6 AM y necesita optimizar su día basándose en sus patrones reales.

### METAS PRINCIPALES
- Reducir grasa visceral (actualmente nivel 11)
- Alcanzar 2.5L de agua diaria
- Mantener alta productividad trabajando desde casa
- Consistencia en hábitos saludables

### ANÁLISIS DE PATRONES (ÚLTIMOS 7 DÍAS)
**Hábitos:** ${weeklyPattern.habitsPattern}
**Estado de ánimo:** ${weeklyPattern.moodPattern}
**Ejercicio:** ${weeklyPattern.exercisePattern}
**Hidratación:** ${weeklyPattern.hydrationPattern}
**Productividad:** ${weeklyPattern.productivityPattern}
**Tendencia general:** ${weeklyPattern.weeklyTrends}

### CONTEXTO ACTUAL
Hoy es ${dayName}. ${timeContext}

### INSTRUCCIONES
Genera UN consejo específico y accionable para HOY que:
1. Aproveche los patrones positivos identificados
2. Aborde las áreas más críticas para sus metas
3. Sea realista para trabajo desde casa
4. Incluya una acción específica que pueda hacer AHORA

Responde en formato:
{
  "content": "Consejo específico y personalizado en 2-3 oraciones máximo",
  "quickAction": "Acción específica de 5 palabras máximo (opcional)"
}
`;
};

export const generateDailyInsight = async (date: Date): Promise<InsightResult | null> => {
  try {
    // Collect data for the last 7 days
    const weekData: DayData[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = getDaysAgo(date, i);
      const dayData = await collectDayData(dayDate);
      weekData.push(dayData);
    }

    // Analyze patterns
    const patterns = analyzeWeeklyPatterns(weekData);

    // Build prompt
    const prompt = buildContextualPrompt(date, patterns);

    // Get AI config
    const config = getAiConfig('dailyInsight');
    if (!config) {
      throw new Error('No AI config found for daily insights');
    }

    // Generate insight
    const response = await generateAiResponse(prompt, config);
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response);
      return {
        content: parsed.content || response,
        quickAction: parsed.quickAction
      };
    } catch {
      // If not JSON, use as plain text
      return {
        content: response
      };
    }

  } catch (error) {
    console.error('Error generating daily insight:', error);
    
    // Return fallback insight based on day of week
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayName = dayNames[date.getDay()];
    
    const fallbackInsights: Record<string, string> = {
      'lunes': 'Empieza la semana hidratándote bien (600ml ahora) y elige 1-2 tareas importantes para generar momentum.',
      'martes': 'Los martes sueles tener menos energía. Prioriza hidratación y tareas que requieran menos concentración.',
      'miércoles': 'Mitad de semana es tu momento fuerte. Aprovecha para las tareas más desafiantes.',
      'jueves': 'Mantén el ritmo con agua constante y ejercicio ligero para preparar el fin de semana.',
      'viernes': 'Los viernes bajas el ritmo. Enfócate en completar pendientes importantes antes del fin de semana.',
      'sábado': 'Fin de semana: balance entre descanso y mantener hábitos básicos (agua e hidratación).',
      'domingo': 'Día de recuperación. Planifica la próxima semana y mantén hábitos ligeros.'
    };

    return {
      content: fallbackInsights[dayName] || 'Enfócate en hidratación constante y mantén tus hábitos básicos.',
      quickAction: 'Beber 300ml agua'
    };
  }
};