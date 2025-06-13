// src/features/mood/types/index.ts
export interface MoodEntry {
  emoji: string;
  text: string;
  time: string;
  timestamp: number;
  value?: number; // Valor numérico del 1-10 para análisis
}

export interface DailyMood {
  id: string;
  userId: string;
  date: string;
  moods: MoodEntry[];
}

export interface MoodProps {
  selectedDate: Date;
}

export interface MoodOption {
  emoji: string;
  text: string;
  value: number;
}

// Helper para obtener el valor numérico de un mood por texto
export const getMoodValue = (moodText: string): number => {
  const mood = MOODS.find(m => m.text === moodText);
  return mood?.value ?? 5; // Default neutro si no se encuentra
};

// Helper para obtener el promedio de moods
export const calculateMoodAverage = (moods: MoodEntry[]): number => {
  if (moods.length === 0) return 0;
  const sum = moods.reduce((acc, mood) => {
    return acc + (mood.value ?? getMoodValue(mood.text));
  }, 0);
  return Math.round((sum / moods.length) * 10) / 10; // Redondear a 1 decimal
};

export const MOODS = [
  // Estados muy positivos (8-10)
  { emoji: '😍', text: 'Enamorado', value: 10 },
  { emoji: '😊', text: 'Feliz', value: 10 },
  { emoji: '🌟', text: 'Energético', value: 10 },
  { emoji: '🧠', text: 'Productivo', value: 10 },
  
  // Estados neutrales/positivos (6-7)
  { emoji: '😎', text: 'Confiado', value: 9 },
  { emoji: '😌', text: 'Tranquilo', value: 8 },
  { emoji: '🤔', text: 'Pensativo', value: 6 },
  
  // Estados neutrales/ligeramente negativos (4-5)
  { emoji: '🥱', text: 'Aburrido', value: 5 },
  { emoji: '😴', text: 'Pereza', value: 4 },
  { emoji: '😕', text: 'Confundido', value: 5 },
  
  // Estados negativos (2-3)
  { emoji: '😬', text: 'Nervioso', value: 3 },
  { emoji: '🤯', text: 'Abrumado', value: 3 },
  { emoji: '😤', text: 'Frustración', value: 3 },
  { emoji: '😰', text: 'Ansioso', value: 2 },
  { emoji: '😪', text: 'Cansado', value: 2 },
  
  // Estados muy negativos (1)
  { emoji: '😢', text: 'Triste', value: 1 },
  { emoji: '😡', text: 'Enojado', value: 1 },
  { emoji: '🤒', text: 'Enfermo', value: 1 }
] as const;

export interface EditMoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  moodEntry: MoodEntry | null;
  onSave: (entry: MoodEntry) => Promise<void>;
  onDelete?: () => Promise<void>;
}