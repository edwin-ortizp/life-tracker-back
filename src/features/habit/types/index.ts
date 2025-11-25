// src/features/habit/types/index.ts
export interface Habit {
    id: number;
    name: string;
    icon: string;
    timeOfDay: 'morning' | 'afternoon' | 'night' | 'anytime';
    goal: string;
    steps?: string[];
    baseTime: string;  // Hora base en formato "HH:mm" (ej: "07:00", "13:30")
  }
  
  export interface HabitProps {
    selectedDate: Date;
  }
  
export const HABITS: Habit[] = [
    // Morning habits (6:00-11:59)
    { id: 1, name: 'Tomar Agua (mañana)', icon: '💧', timeOfDay: 'morning', goal: '5 min', baseTime: '05:50', steps: ['Llenar un vaso con agua', 'Beber lentamente'] },
    /* { id: 19, name: 'Trotar 1km', icon: '🏃‍♀️‍➡️', timeOfDay: 'morning', goal: '10 min', baseTime: '07:15' }, */
    { id: 2, name: 'Ejercicio', icon: '🎾', timeOfDay: 'morning', goal: '40 min', baseTime: '07:00', steps: ['Preparar el equipo', 'Hacer calentamiento', 'Realizar ejercicio principal', 'Hacer enfriamiento', 'Estirar músculos'] },
    { id: 3, name: 'Ducha fria', icon: '🚿', timeOfDay: 'morning', goal: '10 min', baseTime: '08:15', steps: ['Preparar toalla', 'Graduar temperatura del agua', 'Entrar lentamente', 'Respirar profundamente', 'Secar completamente'] },
    { id: 4, name: 'Desayuno', icon: '🍳', timeOfDay: 'morning', goal: '30 min', baseTime: '08:30', steps: ['Preparar ingredientes', 'Cocinar alimentos', 'Servir en plato', 'Comer sin distracciones', 'Lavar los platos'] },
    { id: 5, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'morning', goal: '2 min', baseTime: '09:00', steps: ['Preparar cepillo y pasta', 'Cepillar durante 2 minutos', 'Enjuagar boca', 'Limpiar cepillo'] },
    { id: 6, name: 'Seda Dental', icon: '🦷', timeOfDay: 'morning', goal: '2 min', baseTime: '09:05', steps: ['Tomar hilo dental', 'Limpiar entre cada diente', 'Enjuagar boca', 'Guardar hilo dental'] },
    { id: 7, name: 'Tender la cama', icon: '🛏️', timeOfDay: 'morning', goal: '3 min', baseTime: '09:10', steps: ['Estirar sábanas', 'Acomodar almohadas', 'Doblar cobijas', 'Verificar que esté ordenada'] },
    { id: 20, name: 'Lavar loza del desayuno', icon: '🧽', timeOfDay: 'morning', goal: '10 min', baseTime: '09:15', steps: ['Fregar los platos', 'Enjuagar y secar'] },
    { id: 22, name: 'Aplicarme bloqueador solar', icon: '☀️', timeOfDay: 'morning', goal: '5 min', baseTime: '09:30', steps: ['Aplicar bloqueador en cara', 'Aplicar bloqueador en cuello'] },

    // Afternoon habits (12:00-17:59)
    { id: 8, name: 'Almuerzo', icon: '🍽️', timeOfDay: 'afternoon', goal: '60 min', baseTime: '12:30', steps: ['Planificar el menú', 'Preparar ingredientes', 'Cocinar platos', 'Servir comida', 'Comer tranquilamente', 'Lavar platos'] },
    { id: 9, name: 'Siesta', icon: '🛌', timeOfDay: 'afternoon', goal: '15 min', baseTime: '13:00', steps: ['Encontrar lugar cómodo', 'Cerrar ojos', 'Respirar profundamente', 'Relajarse completamente'] },
    { id: 10, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'afternoon', goal: '2 min', baseTime: '13:15', steps: ['Preparar cepillo y pasta', 'Cepillar durante 2 minutos', 'Enjuagar boca', 'Limpiar cepillo'] },
    { id: 11, name: 'Seda Dental', icon: '🦷', timeOfDay: 'afternoon', goal: '2 min', baseTime: '13:30', steps: ['Tomar hilo dental', 'Limpiar entre cada diente', 'Enjuagar boca', 'Guardar hilo dental'] },
    { id: 19, name: 'Tomar agua (tarde)', icon: '💧', timeOfDay: 'afternoon', goal: '5 min', baseTime: '15:00', steps: ['Llenar un vaso con agua', 'Beber lentamente'] },

    // Night habits (18:00-22:00)
    { id: 12, name: 'Cena', icon: '🍽️', timeOfDay: 'night', goal: '30 min', baseTime: '19:00', steps: ['Elegir alimentos ligeros', 'Cocinar sin prisa', 'Cenar temprano', 'Lavar platos'] },
    { id: 13, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'night', goal: '2 min', baseTime: '19:45', steps: ['Preparar cepillo y pasta', 'Cepillar durante 2 minutos', 'Enjuagar boca', 'Limpiar cepillo'] },
    { id: 14, name: 'Seda Dental', icon: '🦷', timeOfDay: 'night', goal: '2 min', baseTime: '19:50', steps: ['Tomar hilo dental', 'Limpiar entre cada diente', 'Enjuagar boca', 'Guardar hilo dental'] },
    { id: 15, name: 'Llevar el diario', icon: '📓', timeOfDay: 'night', goal: '10 min', baseTime: '20:00', steps: ['Abrir el diario', 'Reflexionar sobre el día', 'Escribir pensamientos', 'Cerrar y guardar'] },
    { id: 16, name: 'Botar algo que no sirva', icon: '🗑️', timeOfDay: 'night', goal: '10 min', baseTime: '20:15', steps: ['Buscar objetos innecesarios', 'Evaluar si sirven', 'Desechar responsablemente', 'Limpiar el área'] },
    { id: 17, name: 'Organizar la cocina', icon: '🍴', timeOfDay: 'night', goal: '15 min', baseTime: '20:30', steps: ['Lavar platos pendientes', 'Guardar utensilios', 'Limpiar superficies', 'Organizar despensa'] },
    { id: 18, name: 'Lectura', icon: '📚', timeOfDay: 'night', goal: '5 min', baseTime: '20:50', steps: ['Elegir libro', 'Encontrar lugar cómodo', 'Leer sin distracciones', 'Marcar página'] },
    { id: 21, name: 'Lista de pendientes', icon: '📝', timeOfDay: 'night', goal: '15 min', baseTime: '21:00', steps: ['Revisar tareas pendientes', 'Priorizar actividades', 'Anotar nuevas tareas'] },
    { id: 23, name: 'Alistar la ropa para mañana', icon: '👕', timeOfDay: 'night', goal: '5 min', baseTime: '21:20', steps: ['Seleccionar ropa adecuada', 'Preparar accesorios'] }
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
    19: 'bg-indigo-500',
    20: 'bg-yellow-600',
    21: 'bg-pink-600',
    22: 'bg-blue-600',
    23: 'bg-green-600'
} as const;
  
  // src/features/habit/utils/dateUtils.ts
  export const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const week = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - day + i);
      week.push({
        dayName: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][date.getDay()],
        fullDate: date.toISOString().split('T')[0]
      });
    }
    
    return week;
  };
  
  export const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };