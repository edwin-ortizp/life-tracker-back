// src/features/mood/types/index.ts
export interface MoodEntry {
  emoji: string;
  text: string;
  time: string;
  timestamp: number;
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

export const MOODS = [
  { emoji: '😍', text: 'Enamorado' },
  { emoji: '😊', text: 'Feliz' },
  { emoji: '🌟', text: 'Energético' },
  { emoji: '😎', text: 'Confiado' },
  { emoji: '🧠', text: 'Productivo' },
  { emoji: '😌', text: 'Tranquilo' },
  { emoji: '🤔', text: 'Pensativo' },
  { emoji: '🥱', text: 'Aburrido' },
  { emoji: '😬', text: 'Nervioso' },
  { emoji: '😕', text: 'Confundido' },
  { emoji: '🤯', text: 'Abrumado' },
  { emoji: '😰', text: 'Ansioso' },
  { emoji: '😴', text: 'Cansado' },
  { emoji: '😢', text: 'Triste' },
  { emoji: '😡', text: 'Enojado' },
  { emoji: '🤒', text: 'Enfermo' }
] as const;

export interface EditMoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  moodEntry: MoodEntry | null;
  onSave: (entry: MoodEntry) => Promise<void>;
  onDelete?: () => Promise<void>;
}