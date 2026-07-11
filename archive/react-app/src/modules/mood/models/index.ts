// src/modules/mood/types/index.ts
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
  energyFirst?: boolean;
}

export interface MoodOption {
  emoji: string;
  text: string;
  value: number;
}

// Helper para obtener el promedio de moods
export const calculateMoodAverage = (moods: MoodEntry[]): number => {
  if (moods.length === 0) return 0;
  const sum = moods.reduce((acc, mood) => {
    return acc + (mood.value ?? 5); // Use value directly or default to 5
  }, 0);
  return Math.round((sum / moods.length) * 10) / 10; // Redondear a 1 decimal
};

export interface EditMoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  moodEntry: MoodEntry | null;
  onSave: (entry: MoodEntry) => Promise<void>;
  onDelete?: () => Promise<void>;
}
export interface EnergyEntry {
  level: number; // 1-5
  time: string;
  timestamp: number;
  comment?: string;
}

export interface DailyEnergy {
  id: string;
  userId: string;
  date: string;
  entries: EnergyEntry[];
}

export interface EnergyProps {
  selectedDate: Date;
}

export interface EditEnergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  energyEntry: EnergyEntry | null;
  onSave: (entry: EnergyEntry) => Promise<void>;
  onDelete?: () => Promise<void>;
}
