// src/features/mood/types/index.ts
export interface Mood {
    id: string;
    emoji: string;
    text: string;
    date: string;
    time: string;
    timestamp: string;
  }
  
  export interface MoodProps {
    selectedDate: Date;
  }
  
  export const MOODS = [
    { emoji: '😊', text: 'Feliz' },
    { emoji: '🌟', text: 'Energético' },
    { emoji: '😌', text: 'Tranquilo' },
    { emoji: '😴', text: 'Cansado' },
    { emoji: '🧠', text: 'Productivo' },
    { emoji: '😰', text: 'Ansioso' }
  ] as const;