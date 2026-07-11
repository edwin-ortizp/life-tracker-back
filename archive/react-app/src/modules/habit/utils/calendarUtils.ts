// src/modules/habit/utils/calendarUtils.ts
import { HABIT_COLORS } from '../models';

/**
 * Parsea el campo "goal" de un hábito para extraer la duración en minutos
 * @param goal - String como "40 min", "2 min", "1h", etc.
 * @returns Duración en minutos, o 30 por defecto si no se puede parsear
 */
export function parseGoalDuration(goal: string): number {
  const match = goal.match(/(\d+)\s*(min|h|hora)/i);
  if (!match) return 30; // Default: 30 minutos

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  return unit.startsWith('h') ? value * 60 : value;
}

/**
 * Calcula la altura del bloque de hábito en el calendario
 * Los hábitos siempre ocupan 15 minutos visuales (25px) para distinguirlos de las tareas
 * @param _durationMinutes - Duración del hábito en minutos (no se usa, solo por compatibilidad)
 * @returns Altura fija de 25px (equivalente a 15 minutos en el calendario)
 */
export function calculateHabitHeight(_durationMinutes: number): number {
  // Los hábitos siempre ocupan 15 minutos visuales (la mitad de una tarea de 30 min)
  // 30 min = 50px, entonces 15 min = 25px
  return 25;
}

/**
 * Combina un string de tiempo "HH:mm" con una fecha base para crear un objeto Date completo
 * @param timeStr - Tiempo en formato "HH:mm" (ej: "07:30")
 * @param baseDate - Fecha base para mantener día/mes/año
 * @returns Objeto Date con la hora especificada
 */
export function parseTimeToDate(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map((n) => parseInt(n, 10));
  const newDate = new Date(baseDate);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Obtiene los colores de gradiente para un hábito basado en su ID
 * @param habitId - ID del hábito
 * @returns Objeto con colores `from` y `to` para el gradiente
 */
export function getHabitGradientColors(habitId: number): {
  from: string;
  to: string;
} {
  // Mapeo de clases Tailwind a valores hexadecimales
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
    'bg-yellow-500': '#eab308',
    'bg-orange-500': '#f97316',
    'bg-purple-500': '#a855f7',
    'bg-pink-500': '#ec4899',
    'bg-red-500': '#ef4444',
    'bg-teal-500': '#14b8a6',
    'bg-indigo-500': '#6366f1',
    'bg-gray-500': '#6b7280',
    'bg-lime-500': '#84cc16',
    'bg-amber-500': '#f59e0b',
    'bg-cyan-500': '#06b6d4',
    'bg-fuchsia-500': '#d946ef',
    'bg-rose-500': '#f43f5e',
    'bg-violet-500': '#8b5cf6',
    'bg-sky-500': '#0ea5e9',
    'bg-emerald-500': '#10b981',
    'bg-yellow-600': '#ca8a04',
    'bg-pink-600': '#db2777',
    'bg-blue-600': '#2563eb',
    'bg-green-600': '#16a34a',
  };

  const habitColor = HABIT_COLORS[habitId] || 'bg-purple-500';
  const baseColor = colorMap[habitColor] || '#a855f7';

  return {
    from: '#ffffff', // Siempre blanco
    to: baseColor,
  };
}
