import { getLocalDateString, getDaysAgo } from '@/utils/dates';
import { getAiConfig } from '@/config/ai';
import { generateAiResponse } from '@/utils/ai';
import { db } from '@/firebase';
import { doc, getDoc, query, collection, where, getDocs, Timestamp } from 'firebase/firestore';
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
    count: number;
  };
  energy: {
    average: number;
    entries: Array<{ time: string; level: number; comment?: string }>;
    count: number;
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
  pomodoro: {
    sessions: number;
    minutes: number;
    completionRate: number;
  };
  negativeHabits: {
    count: number;
    types: string[];
  };
  journal: {
    hasEntry: boolean;
    wordCount: number;
  };
}

interface WeeklyPattern {
  habitsPattern: string;
  moodPattern: string;
  energyPattern: string;
  exercisePattern: string;
  hydrationPattern: string;
  productivityPattern: string;
  pomodoroPattern: string;
  negativeHabitsPattern: string;
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
        const habitKey = `${habit.id}_${dateStr}`;
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
    
    let moodData = { average: 0, entries: [], count: 0 };
    if (moodDoc.exists()) {
      const data = moodDoc.data();
      const moods = data.moods || [];
      if (moods.length > 0) {
        // Use the helper function to calculate proper mood values
        const average = moods.reduce((sum: number, mood: any) => {
          // Use value if available, otherwise calculate from text
          const moodValue = mood.value || (() => {
            const MOODS = [
              { emoji: '😍', text: 'Enamorado', value: 10 },
              { emoji: '😊', text: 'Feliz', value: 10 },
              { emoji: '🌟', text: 'Energético', value: 10 },
              { emoji: '🧠', text: 'Productivo', value: 10 },
              { emoji: '😎', text: 'Confiado', value: 9 },
              { emoji: '😌', text: 'Tranquilo', value: 8 },
              { emoji: '🤔', text: 'Pensativo', value: 6 },
              { emoji: '🥱', text: 'Aburrido', value: 5 },
              { emoji: '😴', text: 'Pereza', value: 4 },
              { emoji: '😕', text: 'Confundido', value: 5 },
              { emoji: '😬', text: 'Nervioso', value: 3 },
              { emoji: '🤯', text: 'Abrumado', value: 3 },
              { emoji: '😤', text: 'Frustración', value: 3 },
              { emoji: '😰', text: 'Ansioso', value: 2 },
              { emoji: '😪', text: 'Cansado', value: 2 },
              { emoji: '😢', text: 'Triste', value: 1 },
              { emoji: '😡', text: 'Enojado', value: 1 },
              { emoji: '🤒', text: 'Enfermo', value: 1 }
            ];
            const foundMood = MOODS.find(m => m.text === mood.text);
            return foundMood?.value ?? 5;
          })();
          return sum + moodValue;
        }, 0) / moods.length;
        
        moodData = {
          average: Math.round(average * 10) / 10, // Round to 1 decimal
          entries: moods.map((mood: any) => ({
            time: mood.time,
            mood: mood.text || '',
            emoji: mood.emoji || ''
          })),
          count: moods.length
        };
      }
    }

    // Collect energy data
    const energyDocRef = doc(db, 'energy', `${userId}_${dateStr}`);
    const energyDoc = await getDoc(energyDocRef);
    
    let energyData = { average: 0, entries: [], count: 0 };
    if (energyDoc.exists()) {
      const data = energyDoc.data();
      const entries = data.entries || [];
      if (entries.length > 0) {
        const average = entries.reduce((sum: number, entry: any) => sum + (entry.level || 0), 0) / entries.length;
        energyData = {
          average: Math.round(average * 10) / 10, // Round to 1 decimal
          entries: entries.map((entry: any) => ({
            time: entry.time,
            level: entry.level || 0,
            comment: entry.comment || ''
          })),
          count: entries.length
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
      
      // Use 'amount' field and convert from ml to liters
      const totalMl = drinks.reduce((sum: number, drink: { amount?: number }) => sum + (drink.amount || 0), 0);
      const totalLiters = totalMl / 1000; // Convert ml to liters
      
      waterData = {
        liters: Math.round(totalLiters * 10) / 10, // Round to 1 decimal
        entries: drinks.length
      };
    }

    // Collect tasks data - get tasks completed on this specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      where('completed', '==', true),
      where('updatedAt', '>=', Timestamp.fromDate(startOfDay)),
      where('updatedAt', '<=', Timestamp.fromDate(endOfDay))
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    
    let tasksData = { completed: 0, pending: 0, completedTitles: [] as string[] };
    const completedTasks = tasksSnapshot.docs;
    
    tasksData = {
      completed: completedTasks.length,
      pending: 0, // We don't query pending tasks for daily insight
      completedTitles: completedTasks.map(doc => doc.data().title || '').slice(0, 5) // Limit to 5 titles
    };

    // Collect pomodoro data
    const pomodoroDocRef = doc(db, 'pomodoro', `${userId}_${dateStr}`);
    const pomodoroDoc = await getDoc(pomodoroDocRef);
    
    let pomodoroData = { sessions: 0, minutes: 0, completionRate: 0 };
    if (pomodoroDoc.exists()) {
      const data = pomodoroDoc.data();
      const sessions = data.sessions || [];
      const sessionCount = sessions.length;
      
      // Calculate total work minutes from sessions
      const totalMinutes = sessions.reduce((sum: number, session: any) => {
        const sessionMinutes = session.duration ? Math.round(session.duration / 60) : 0;
        return sum + sessionMinutes;
      }, 0);
      
      // Expected work time (e.g., 8 sessions of 25 min = 200 min)
      const expectedMinutes = sessionCount * 25;
      const completionRate = expectedMinutes > 0 ? Math.min(100, (totalMinutes / expectedMinutes) * 100) : 0;
      
      pomodoroData = {
        sessions: sessionCount,
        minutes: totalMinutes,
        completionRate: Math.round(completionRate * 10) / 10
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

    // Collect negative habits data
    const negativeHabitsDocRef = doc(db, 'negative-habits', `${userId}_${yearMonth}`);
    const negativeHabitsDoc = await getDoc(negativeHabitsDocRef);
    
    let negativeHabitsData = { count: 0, types: [] as string[] };
    if (negativeHabitsDoc.exists()) {
      const data = negativeHabitsDoc.data();
      const dayHabits = data.habits?.[dateStr] || {};
      const habitEntries = Object.entries(dayHabits).filter(([_, value]) => value !== undefined);
      
      negativeHabitsData = {
        count: habitEntries.length,
        types: habitEntries.map(([habitId, _]) => {
          // You might want to map habitId to actual habit names here
          return `Hábito Negativo ${habitId}`;
        }).slice(0, 3) // Limit to 3 most recent
      };
    }

    return {
      date: dateStr,
      habits: habitsData,
      mood: moodData,
      energy: energyData,
      exercise: exerciseData,
      water: waterData,
      tasks: tasksData,
      pomodoro: pomodoroData,
      negativeHabits: negativeHabitsData,
      journal: journalData
    };
    
  } catch (error) {
    console.error('Error collecting day data:', error);
    // Return empty data structure on error
    return {
      date: dateStr,
      habits: { completed: 0, total: 0, completedList: [], missedList: [] },
      mood: { average: 0, entries: [], count: 0 },
      energy: { average: 0, entries: [], count: 0 },
      exercise: { minutes: 0, calories: 0, types: [] },
      water: { liters: 0, entries: 0 },
      tasks: { completed: 0, pending: 0, completedTitles: [] },
      pomodoro: { sessions: 0, minutes: 0, completionRate: 0 },
      negativeHabits: { count: 0, types: [] },
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
  
  // Get most frequently missed habits
  const allMissedHabits = weekData.flatMap(d => d.habits.missedList);
  const missedHabitsCount = allMissedHabits.reduce((acc, habit) => {
    acc[habit] = (acc[habit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topMissedHabits = Object.entries(missedHabitsCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([habit]) => habit);

  let habitsPattern = `Promedio semanal de hábitos: ${Math.round(avgHabits * 100)}%`;
  if (topMissedHabits.length > 0) {
    habitsPattern += `, más olvidados: ${topMissedHabits.join(', ')}`;
  }
  if (weekendHabits < weekdayHabits - 0.2) {
    habitsPattern += ", con notable bajón en fines de semana";
  } else if (weekendHabits > weekdayHabits + 0.1) {
    habitsPattern += ", mejor rendimiento en fines de semana";
  }

  // Analyze mood pattern
  const moodAvgs = weekData.map(d => d.mood.average).filter(m => m > 0);
  const avgMood = moodAvgs.length > 0 ? moodAvgs.reduce((a, b) => a + b, 0) / moodAvgs.length : 0;
  let moodPattern = `Estado de ánimo promedio: ${avgMood.toFixed(1)}/10`;
  
  const lowMoodDays = weekData
    .map((d, i) => ({ day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i], mood: d.mood.average }))
    .filter(d => d.mood > 0 && d.mood < 5)
    .map(d => d.day);
  
  if (lowMoodDays.length > 0) {
    moodPattern += `, días difíciles: ${lowMoodDays.join(', ')}`;
  }

  // Analyze energy pattern
  const energyAvgs = weekData.map(d => d.energy.average).filter(e => e > 0);
  const avgEnergy = energyAvgs.length > 0 ? energyAvgs.reduce((a, b) => a + b, 0) / energyAvgs.length : 0;
  let energyPattern = `Nivel de energía promedio: ${avgEnergy.toFixed(1)}/5`;
  
  const lowEnergyDays = weekData
    .map((d, i) => ({ day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i], energy: d.energy.average }))
    .filter(d => d.energy > 0 && d.energy < 2.5)
    .map(d => d.day);
  
  if (lowEnergyDays.length > 0) {
    energyPattern += `, días con baja energía: ${lowEnergyDays.join(', ')}`;
  } else if (avgEnergy >= 4) {
    energyPattern += " - excelente nivel energético";
  }

  // Analyze exercise pattern
  const exerciseMinutes = weekData.map(d => d.exercise.minutes);
  const totalExercise = exerciseMinutes.reduce((a, b) => a + b, 0);
  const exerciseDays = exerciseMinutes.filter(m => m > 0).length;
  
  // Get most common exercise types
  const allExerciseTypes = weekData.flatMap(d => d.exercise.types);
  const exerciseTypeCount = allExerciseTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topExercises = Object.entries(exerciseTypeCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);
  
  let exercisePattern = `${exerciseDays}/7 días con ejercicio (${totalExercise} min total)`;
  if (topExercises.length > 0) {
    exercisePattern += `, principales: ${topExercises.join(', ')}`;
  }
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

  // Analyze pomodoro pattern
  const pomodoroSessions = weekData.map(d => d.pomodoro.sessions);
  const totalSessions = pomodoroSessions.reduce((a, b) => a + b, 0);
  const avgSessions = totalSessions / 7;
  const pomodoroMinutes = weekData.map(d => d.pomodoro.minutes);
  const totalPomodoroMinutes = pomodoroMinutes.reduce((a, b) => a + b, 0);
  
  let pomodoroPattern = `Pomodoros: ${avgSessions.toFixed(1)} sesiones/día promedio (${totalPomodoroMinutes} min total)`;
  const activePomoroDays = pomodoroSessions.filter(s => s > 0).length;
  if (activePomoroDays >= 5) {
    pomodoroPattern += " - excelente consistencia en trabajo enfocado";
  } else if (activePomoroDays >= 3) {
    pomodoroPattern += " - buen uso de técnica Pomodoro";
  } else if (activePomoroDays > 0) {
    pomodoroPattern += " - uso ocasional de trabajo enfocado";
  } else {
    pomodoroPattern += " - sin trabajo enfocado registrado";
  }

  // Analyze negative habits pattern
  const negativeHabitsCount = weekData.map(d => d.negativeHabits.count);
  const totalNegativeHabits = negativeHabitsCount.reduce((a, b) => a + b, 0);
  const avgNegativeHabits = totalNegativeHabits / 7;
  
  let negativeHabitsPattern = `Hábitos negativos: ${avgNegativeHabits.toFixed(1)} incidencias/día promedio`;
  const problemDays = weekData
    .map((d, i) => ({ day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i], count: d.negativeHabits.count }))
    .filter(d => d.count > 2)
    .map(d => d.day);
  
  if (problemDays.length > 0) {
    negativeHabitsPattern += `, días difíciles: ${problemDays.join(', ')}`;
  } else if (totalNegativeHabits === 0) {
    negativeHabitsPattern += " - excelente autocontrol esta semana";
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
    energyPattern,
    exercisePattern,
    hydrationPattern,
    productivityPattern,
    pomodoroPattern,
    negativeHabitsPattern,
    weeklyTrends
  };
};

const buildContextualPrompt = (targetDate: Date, weeklyPattern: WeeklyPattern, weekData: DayData[]): string => {
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

  // Add specific details about recent performance
  const yesterdayData = weekData[weekData.length - 2]; // Yesterday
  
  let recentDetails = "";
  if (yesterdayData) {
    const recentHabits = yesterdayData.habits.completedList.length > 0 
      ? `Ayer completaste: ${yesterdayData.habits.completedList.slice(0, 3).join(', ')}`
      : "Ayer no completaste hábitos";
    
    const recentMood = yesterdayData.mood.average > 0 
      ? `Estado de ánimo ayer: ${yesterdayData.mood.average}/10`
      : "Sin registro de estado de ánimo ayer";
    
    const recentEnergy = yesterdayData.energy.average > 0 
      ? `Nivel de energía ayer: ${yesterdayData.energy.average}/5`
      : "Sin registro de energía ayer";
    
    const recentExercise = yesterdayData.exercise.minutes > 0 
      ? `Ejercicio ayer: ${yesterdayData.exercise.minutes}min (${yesterdayData.exercise.types.join(', ')})`
      : "Sin ejercicio ayer";
    
    const recentPomodoro = yesterdayData.pomodoro.sessions > 0 
      ? `Trabajo enfocado ayer: ${yesterdayData.pomodoro.sessions} pomodoros (${yesterdayData.pomodoro.minutes}min)`
      : "Sin trabajo enfocado ayer";
    
    const recentNegativeHabits = yesterdayData.negativeHabits.count > 0 
      ? `Hábitos negativos ayer: ${yesterdayData.negativeHabits.count} incidencias`
      : "Sin hábitos negativos ayer";
    
    recentDetails = `
### RENDIMIENTO RECIENTE
${recentHabits}
${recentMood}
${recentEnergy}
${recentExercise}
${recentPomodoro}
Hidratación ayer: ${yesterdayData.water.liters}L
Tareas completadas ayer: ${yesterdayData.tasks.completed}
${recentNegativeHabits}`;
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
**Nivel de energía:** ${weeklyPattern.energyPattern}
**Ejercicio:** ${weeklyPattern.exercisePattern}
**Hidratación:** ${weeklyPattern.hydrationPattern}
**Productividad:** ${weeklyPattern.productivityPattern}
**Trabajo enfocado:** ${weeklyPattern.pomodoroPattern}
**Hábitos negativos:** ${weeklyPattern.negativeHabitsPattern}
**Tendencia general:** ${weeklyPattern.weeklyTrends}
${recentDetails}

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
    const prompt = buildContextualPrompt(date, patterns, weekData);

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