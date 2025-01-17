// src/features/diary/types/index.ts
export interface DiaryEntry {
    userId: string;
    text: string;
    date: string;
    lastUpdated: Date;
    displayTime: string;
  }
  
  export interface DiaryProps {
    selectedDate: Date;
  }