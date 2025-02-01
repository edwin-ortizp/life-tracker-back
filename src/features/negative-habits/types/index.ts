// src/features/negative-habits/types/index.ts

import { az } from "date-fns/locale";

// Interfaces base
export interface NegativeHabitLog {
    habitId: number;
    timestamp: number;
    note?: string;
  }
  
  // Tipos de categorías
  export type NegativeHabitCategory = 
    | 'health' 
    | 'productivity' 
    | 'social' 
    | 'finance' 
    | 'emotional' 
    | 'digital' 
    | 'environment';
  
  // Props para los componentes
  export interface WeeklyViewProps {
    habits: { [key: string]: NegativeHabitLog };
    onLogHabit: (habitId: number, date: string) => Promise<void>;
    onRemoveLog: (habitId: number, date: string) => Promise<void>;
    disabled?: boolean;
  }
  
  export interface YearlyViewProps {
    habits: { [key: string]: NegativeHabitLog };
    onLogHabit: (habitId: number, date: string) => Promise<void>;
    onRemoveLog: (habitId: number, date: string) => Promise<void>;
  }
  
  export interface AddHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogHabit: (habitId: number, note?: string) => Promise<void>;
    selectedDate: Date;
  }
  
  // Definición de hábitos negativos por categoría
  export interface NegativeHabit {
    id: number;
    name: string;
    icon: string;
    category: NegativeHabitCategory;
    description?: string;
  }
  
  // Información de categorías
  export const NEGATIVE_HABIT_CATEGORIES = {
    health: {
      icon: '🏥',
      label: 'Salud',
      description: 'Hábitos que afectan tu salud física'
    },
    productivity: {
      icon: '⏰',
      label: 'Productividad',
      description: 'Hábitos que reducen tu eficiencia'
    },
    social: {
      icon: '👥',
      label: 'Social',
      description: 'Hábitos que afectan tus relaciones'
    },
    emotional: {
      icon: '😔',
      label: 'Emocional',
      description: 'Hábitos que afectan tu bienestar emocional'
    },
    finance: {
      icon: '💰',
      label: 'Finanzas',
      description: 'Hábitos que impactan tus finanzas'
    },
    digital: {
      icon: '📱',
      label: 'Digital',
      description: 'Hábitos digitales nocivos'
    },
    environment: {
      icon: '🌍',
      label: 'Ambiente',
      description: 'Hábitos que impactan al medio ambiente'
    }
  } as const;
  
  // Colores por categoría
  export const CATEGORY_COLORS: Record<NegativeHabitCategory, string> = {
    health: '#ef4444',      // red-500
    productivity: '#f97316', // orange-500
    social: '#8b5cf6',      // violet-500
    finance: '#84cc16',     // lime-500
    emotional: '#ec4899',   // pink-500
    digital: '#3b82f6',     // blue-500
    environment: '#10b981'  // emerald-500
  };
  
  // Lista de hábitos negativos predefinidos - Ultimo id 27
  export const NEGATIVE_HABITS: NegativeHabit[] = [
    // Salud
    {id: 1, name: 'Saltarse comidas', icon: '🍽️', category: 'health',},
    {id: 2,name: 'Dormir poco',icon: '😴',category: 'health',},
    { id: 3,name: 'No hacer ejercicio',icon: '🏃',category: 'health',},
    {id: 4,name: 'Comer en exceso',icon: '🫃🏻',category: 'health',},
    {id: 25, name: 'Comida chatarra', icon: '🍔', category: 'health',},
    {id: 26, name: 'Exceso de azúcar', icon: '🍭', category: 'health',},
    {id: 27, name: 'Masturbación', icon: '🍆', category: 'health',},

  
    // Productividad
    {id: 5,name: 'Procrastinar',icon: '⏰',category: 'productivity',},
    {
      id: 6,
      name: 'Distracciones',
      icon: '🎯',
      category: 'productivity',
    },
    {
      id: 7,
      name: 'Multitarea',
      icon: '🔄',
      category: 'productivity',
    },
    {id: 8,name: 'Desorganización',icon: '📋',category: 'productivity', },
    {id: 24, name: 'Exceso de trabajo (Workaholic)', icon: '🍽️', category: 'productivity',},

  
    // Social
    {
      id: 9,
      name: 'Aislamiento',icon: '🚶',category: 'social',
    },
    {
      id: 10,
      name: 'Conflictos',
      icon: '💢',
      category: 'social',
    },
    {
      id: 11,
      name: 'No escuchar',
      icon: '👂',
      category: 'social',
    },
    // Emocional
    {
      id: 15,
      name: 'Sobrepensar cosas',
      icon: '😰',
      category: 'emotional',
    },
    {id: 16,name: 'Negatividad / Pesimismo',icon: '🌧️',category: 'emotional',},
    {id: 17,name: 'Ser grosero/estresarme',icon: '💭',category: 'emotional',},
    {id: 28, name: 'Celos compulsivos', icon: '💁🏻‍♂️', category: 'emotional',},
  
    // Finanzas
    {
      id: 12,
      name: 'Gastos impulsivos',
      icon: '💳',
      category: 'finance',
    },
    {
      id: 13,
      name: 'No ahorrar',
      icon: '💰',
      category: 'finance',
    },
    {
      id: 14,
      name: 'Más Deudas',
      icon: '📉',
      category: 'finance',
    },
  
    
  
    // Digital
    {
      id: 18,name: 'Exceso de Redes sociales',
      icon: '📱',category: 'digital',
    },
    {
      id: 19,name: 'Exceso de Videojuegos',
      icon: '🎮',
      category: 'digital',
    },
    {
      id: 20,name: 'Exceso de Netflix',
      icon: '🎬',
      category: 'digital',
    },
  
    // Ambiente
    {
      id: 21,
      name: 'Desperdiciar agua',
      icon: '💧',
      category: 'environment',
    },
    {
      id: 22,
      name: 'No reciclar',
      icon: '♻️',
      category: 'environment',
    },
    {
      id: 23,
      name: 'Consumo excesivo',
      icon: '🛍️',
      category: 'environment',
    },
  ];