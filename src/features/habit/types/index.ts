// src/features/habit/types/index.ts
export interface Habit {
    id: number;
    name: string;
    icon: string;
    timeOfDay: 'morning' | 'afternoon' | 'night' | 'anytime';
    goal: string;
  }
  
  export interface HabitProps {
    selectedDate: Date;
  }
  
export const HABITS: Habit[] = [
    { id: 1, name: 'Tomar Agua', icon: '💧', timeOfDay: 'morning', goal: '5 min' },
    { id: 19, name: 'Trotar 1km', icon: '🏃‍♀️‍➡️', timeOfDay: 'morning', goal: '10 min' },
    { id: 2, name: 'Jugar tenis', icon: '🎾', timeOfDay: 'morning', goal: '40 min' },
    { id: 3, name: 'Ducha fria', icon: '🚿', timeOfDay: 'morning', goal: '10 min' },
    { id: 4, name: 'Desayuno', icon: '🍳', timeOfDay: 'morning', goal: '30 min' },
    { id: 5, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'morning', goal: '2 min' },
    { id: 6, name: 'Seda Dental', icon: '🦷', timeOfDay: 'morning', goal: '2 min' },
    { id: 7, name: 'Tender la cama', icon: '🛏️', timeOfDay: 'morning', goal: '3 min' },
    { id: 8, name: 'Almuerzo', icon: '🍽️', timeOfDay: 'afternoon', goal: '60 min' },
    { id: 9, name: 'Siesta', icon: '🛌', timeOfDay: 'afternoon', goal: '15 min' },
    { id: 10, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'afternoon', goal: '2 min' },
    { id: 11, name: 'Seda Dental', icon: '🦷', timeOfDay: 'afternoon', goal: '2 min' },
    { id: 12, name: 'Cena', icon: '🍽️', timeOfDay: 'night', goal: '30 min' },
    { id: 13, name: 'Lavarme los dientes', icon: '🪥', timeOfDay: 'night', goal: '2 min' },
    { id: 14, name: 'Seda Dental', icon: '🦷', timeOfDay: 'night', goal: '2 min' },
    { id: 15, name: 'Llevar el diario', icon: '📓', timeOfDay: 'anytime', goal: '10 min' },
    { id: 16, name: 'Botar algo que no sirva', icon: '🗑️', timeOfDay: 'night', goal: '10 min' },
    { id: 17, name: 'Organizar la cocina', icon: '🍴', timeOfDay: 'night', goal: '15 min' },
    { id: 18, name: 'Lectura', icon: '📚', timeOfDay: 'night', goal: '5 min' }
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