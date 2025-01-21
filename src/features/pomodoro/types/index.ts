// src/features/pomodoro/types/index.ts
export interface TimestampWithOffset {
  timestamp: number;
  utcOffset: number;  // en minutos
  formatted: string;  // fecha formateada en español con UTC
}

export interface PomodoroSession {
  startTime: TimestampWithOffset;
  endTime: TimestampWithOffset;
  duration: number;
  completed: boolean;
  description?: string;
}

export interface PomodoroData {
  userId: string;
  date: string; // YYYY-MM-DD en hora local
  count: number;
  sessions: PomodoroSession[];
  updatedAt: any; // Firebase Timestamp
}

export interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalTime: number; // en segundos
  averageSessionTime: number; // en segundos
  completionRate: number; // porcentaje
  bestDay?: {
    date: string; // formato dd/MM/yyyy
    sessions: number;
  };
}