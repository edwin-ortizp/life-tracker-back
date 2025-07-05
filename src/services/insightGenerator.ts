import { getLocalDateString, getDaysAgo } from '@/utils/dates';
import { getAiConfig } from '@/config/ai';
import { generateAiResponse } from '@/utils/ai';
import { db } from '@/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { HABITS } from '@/features/habit/types';
import { EXERCISES } from '@/features/exercise/types';

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
  prompt?: string;
}

// Data collectors integrated with real Firebase data
const collectDayData = async (date: Date, userId: string): Promise<DayData> => {
  const dateStr = getLocalDateString(date);
  
  try {
    // Collect habits data
    const [year, month] = dateStr.split('-');
    const yearMonth = `${year}-${month}`;
    const habitDocRef = doc(db, 'habits', `${userId}_${yearMonth}`);
    const habitDoc = await getDoc(habitDocRef);
    
    let habitsData = { completed: 0, total: 0, completedList: [] as string[], missedList: [] as string[] };
    if (habitDoc.exists()) {
      const data = habitDoc.data();
      const dayHabits = data.habits || {};
      const totalHabits = HABITS.length;
      
      let completedCount = 0;
      const completedList: string[] = [];
      const missedList: string[] = [];
      
      HABITS.forEach(habit => {
        const habitKey = `${dateStr}_${habit.id}`;
        if (dayHabits[habitKey]) {
          completedCount++;
          completedList.push(habit.name);
        } else {
          missedList.push(habit.name);
        }
      });
      
      habitsData = {
        completed: completedCount,
        total: totalHabits,
        completedList: completedList,
        missedList: missedList
      };
    }

    // Collect mood data
    const moodDocRef = doc(db, 'moods', `${userId}_${dateStr}`);
    const moodDoc = await getDoc(moodDocRef);
    
    let moodData = { average: 0, entries: [] };
    if (moodDoc.exists()) {
      const data = moodDoc.data();
      const entries = data.entries || [];
      if (entries.length > 0) {
        const average = entries.reduce((sum: number, entry: any) => sum + entry.mood, 0) / entries.length;
        moodData = {
          average,
          entries: entries.map((entry: any) => ({
            time: entry.time,
            mood: entry.mood.toString(),
            emoji: entry.emoji || ''
          }))
        };
      }
    }

    // Collect exercise data
    const exerciseDocRef = doc(db, 'exercises', `${userId}_${dateStr}`);
    const exerciseDoc = await getDoc(exerciseDocRef);
    
    let exerciseData = { minutes: 0, calories: 0, types: [] as string[] };
    if (exerciseDoc.exists()) {
      const data = exerciseDoc.data();
      const exercises = data.exercises || [];
      
      const totalMinutes = exercises.reduce((sum: number, ex: { duration?: number }) => sum + (ex.duration || 0), 0);
      const totalCalories = exercises.reduce((sum: number, ex: { calories?: number }) => sum + (ex.calories || 0), 0);
      const types = exercises.map((ex: { exerciseId: number }) => {
        const exercise = EXERCISES.find(e => e.id === ex.exerciseId);
        return exercise ? exercise.name : 'Unknown';
      }).filter((name: string) => name !== 'Unknown');
      
      exerciseData = {
        minutes: totalMinutes,
        calories: totalCalories,
        types: [...new Set(types)] as string[]
      };
    }

    // Collect water data
    const waterDocRef = doc(db, 'water', `${userId}_${dateStr}`);
    const waterDoc = await getDoc(waterDocRef);
    
    let waterData = { liters: 0, entries: 0 };
    if (waterDoc.exists()) {
      const data = waterDoc.data();
      const drinks = data.drinks || [];
      
      const totalLiters = drinks.reduce((sum: number, drink: { hydration?: number }) => sum + (drink.hydration || 0), 0);
      
      waterData = {
        liters: totalLiters,
        entries: drinks.length
      };
    }

    // Collect tasks data
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      where('dateCompleted', '>=', dateStr),
      where('dateCompleted', '<=', dateStr + 'T23:59:59')
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    
    let tasksData = { completed: 0, pending: 0, completedTitles: [] as string[] };
    if (!tasksSnapshot.empty) {
      const completedTasks = tasksSnapshot.docs.filter(doc => doc.data().status === 'completed');
      const pendingTasks = tasksSnapshot.docs.filter(doc => doc.data().status === 'pending');
      
      tasksData = {
        completed: completedTasks.length,
        pending: pendingTasks.length,
        completedTitles: completedTasks.map(doc => doc.data().title || '')
      };
    }

    // Collect journal data
    const journalDocRef = doc(db, 'journal', `${userId}_${dateStr}`);
    const journalDoc = await getDoc(journalDocRef);
    
    let journalData = { hasEntry: false, wordCount: 0 };
    if (journalDoc.exists()) {
      const data = journalDoc.data();
      const text = data.text || '';
      
      journalData = {
        hasEntry: text.length > 0,
        wordCount: text.split(/\s+/).filter((word: string) => word.length > 0).length
      };
    }

    return {
      date: dateStr,
      habits: habitsData,
      mood: moodData,
      exercise: exerciseData,
      water: waterData,
      tasks: tasksData,
      journal: journalData
    };
    
  } catch (error) {
    console.error('Error collecting day data:', error);
    // Return empty data structure on error
    return {
      date: dateStr,
      habits: { completed: 0, total: 0, completedList: [], missedList: [] },
      mood: { average: 0, entries: [] },
      exercise: { minutes: 0, calories: 0, types: [] },
      water: { liters: 0, entries: 0 },
      tasks: { completed: 0, pending: 0, completedTitles: [] },
      journal: { hasEntry: false, wordCount: 0 }
    };
  }
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

Responde ÚNICAMENTE en formato markdown limpio:
- Usa **negrita** para enfatizar puntos clave
- Usa *cursiva* para acciones específicas  
- Máximo 3 oraciones en total
- Sin encabezados, solo el consejo directo
- Termina con una acción específica si es relevante
`;
};

export const generateDailyInsight = async (date: Date, userId: string): Promise<InsightResult | null> => {
  try {
    // Collect data for the last 7 days
    const weekData: DayData[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = getDaysAgo(date, i);
      const dayData = await collectDayData(dayDate, userId);
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
    
    // Return markdown response directly with prompt
    return {
      content: response.trim(),
      prompt: prompt
    };

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
      quickAction: 'Beber 300ml agua',
      prompt: 'Insight generado automáticamente (modo fallback - no se utilizó IA)'
    };
  }
};