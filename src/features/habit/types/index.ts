// src/features/habit/types/index.ts
export interface Habit {
    id: number;
    name: string;
    icon: string;
    timeOfDay: 'morning' | 'afternoon' | 'night' | 'anytime';
    goal: string;
    steps?: string[];
  }
  
  export interface HabitProps {
    selectedDate: Date;
  }
  
export const HABITS: Habit[] = [
    { id: 1, name: 'Tomar Agua (mañana)', icon: '💧', timeOfDay: 'morning', goal: '5 min', steps: ['Llenar un vaso con agua', 'Beber lentamente'] },
    /* { id: 19, name: 'Trotar 1km', icon: '🏃‍♀️‍➡️', timeOfDay: 'morning', goal: '10 min' }, */
    { id: 2, name: 'Ejercicio', icon: '🎾', timeOfDay: 'morning', goal: '40 min', steps: ['Preparar el equipo', 'Hacer calentamiento', 'Realizar ejercicio principal', 'Hacer enfriamiento', 'Estirar músculos'] },
    { id: 3, name: 'Ducha fria', icon: '🚿', timeOfDay: 'morning', goal: '10 min', steps: ['Preparar toalla', 'Graduar temperatura del agua', 'Entrar lentamente', 'Respirar profundamente', 'Secar completamente'] },
    { id: 4, name: 'Desayuno', icon: '🍳', timeOfDay: 'morning', goal: '30 min', steps: ['Preparar ingredientes', 'Cocinar alimentos', 'Servir en plato', 'Comer sin distracciones', 'Lavar los platos'] },
    { id: 5, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'morning', goal: '2 min', steps: ['Preparar cepillo y pasta', 'Cepillar durante 2 minutos', 'Enjuagar boca', 'Limpiar cepillo'] },
    { id: 6, name: 'Seda Dental', icon: '🦷', timeOfDay: 'morning', goal: '2 min', steps: ['Tomar hilo dental', 'Limpiar entre cada diente', 'Enjuagar boca', 'Guardar hilo dental'] },
    { id: 7, name: 'Tender la cama', icon: '🛏️', timeOfDay: 'morning', goal: '3 min', steps: ['Estirar sábanas', 'Acomodar almohadas', 'Doblar cobijas', 'Verificar que esté ordenada'] },
    { id: 8, name: 'Almuerzo', icon: '🍽️', timeOfDay: 'afternoon', goal: '60 min', steps: ['Planificar el menú', 'Preparar ingredientes', 'Cocinar platos', 'Servir comida', 'Comer tranquilamente', 'Lavar platos'] },
    { id: 9, name: 'Siesta', icon: '🛌', timeOfDay: 'afternoon', goal: '15 min', steps: ['Encontrar lugar cómodo', 'Cerrar ojos', 'Respirar profundamente', 'Relajarse completamente'] },
    { id: 10, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'afternoon', goal: '2 min', steps: ['Preparar cepillo y pasta', 'Cepillar durante 2 minutos', 'Enjuagar boca', 'Limpiar cepillo'] },
    { id: 11, name: 'Seda Dental', icon: '🦷', timeOfDay: 'afternoon', goal: '2 min', steps: ['Tomar hilo dental', 'Limpiar entre cada diente', 'Enjuagar boca', 'Guardar hilo dental'] },
    { id: 12, name: 'Cena', icon: '🍽️', timeOfDay: 'night', goal: '30 min', steps: ['Elegir alimentos ligeros', 'Cocinar sin prisa', 'Cenar temprano', 'Lavar platos'] },
    { id: 13, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'night', goal: '2 min', steps: ['Preparar cepillo y pasta', 'Cepillar durante 2 minutos', 'Enjuagar boca', 'Limpiar cepillo'] },
    { id: 14, name: 'Seda Dental', icon: '🦷', timeOfDay: 'night', goal: '2 min', steps: ['Tomar hilo dental', 'Limpiar entre cada diente', 'Enjuagar boca', 'Guardar hilo dental'] },
    { id: 15, name: 'Llevar el diario', icon: '📓', timeOfDay: 'night', goal: '10 min', steps: ['Abrir el diario', 'Reflexionar sobre el día', 'Escribir pensamientos', 'Cerrar y guardar'] },
    { id: 16, name: 'Botar algo que no sirva', icon: '🗑️', timeOfDay: 'night', goal: '10 min', steps: ['Buscar objetos innecesarios', 'Evaluar si sirven', 'Desechar responsablemente', 'Limpiar el área'] },
    { id: 17, name: 'Organizar la cocina', icon: '🍴', timeOfDay: 'night', goal: '15 min', steps: ['Lavar platos pendientes', 'Guardar utensilios', 'Limpiar superficies', 'Organizar despensa'] },
    { id: 18, name: 'Lectura', icon: '📚', timeOfDay: 'night', goal: '5 min', steps: ['Elegir libro', 'Encontrar lugar cómodo', 'Leer sin distracciones', 'Marcar página'] },
    { id: 19, name: 'Tomar agua (tarde)', icon: '💧', timeOfDay: 'afternoon', goal: '5 min', steps: ['Llenar un vaso con agua', 'Beber lentamente'] },
    { id: 20, name: 'Lavar loza del desayuno', icon: '🧽', timeOfDay: 'morning', goal: '10 min', steps: ['Fregar los platos', 'Enjuagar y secar'] },
    { id: 21, name: 'Lista de pendientes', icon: '📝', timeOfDay: 'night', goal: '15 min', steps: ['Revisar tareas pendientes', 'Priorizar actividades', 'Anotar nuevas tareas'] },
] as const;
  
export const HABIT_COLORS: Record<number, string> = {
    1: 'bg-blue-500',
    2: 'bg-green-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-purple-500',
    6: 'bg-pink-500',
    7: 'bg-red-500',
    8: 'bg-teal-500',
    9: 'bg-indigo-500',
    10: 'bg-gray-500',
    11: 'bg-lime-500',
    12: 'bg-amber-500',
    13: 'bg-cyan-500',
    14: 'bg-fuchsia-500',
    15: 'bg-rose-500',
    16: 'bg-violet-500',
    17: 'bg-sky-500',
    18: 'bg-emerald-500',
    19: 'bg-indigo-500'
} as const;