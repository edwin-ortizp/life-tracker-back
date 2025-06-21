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
  totalTime: number; // en segundos
  averageSessionTime: number; // en segundos
  completionRate: number; // porcentaje
  /** Horas promedio trabajadas por día de lunes a viernes */
  averageWeekdayHours?: number;
  bestDay?: {
    date: string; // formato dd/MM/yyyy
    /** Minutos trabajados en el mejor día */
    minutes: number;
  };
}

export interface ActivePomodoro {
  startTime: TimestampWithOffset;
  duration: number;
  pausedAt?: TimestampWithOffset;
  deviceId: string;  // Para manejar conflictos entre dispositivos
}

export interface PomodoroData {
  userId: string;
  date: string;
  count: number;
  sessions: PomodoroSession[];
  activePomodoro?: ActivePomodoro;
  updatedAt: any; // Firebase Timestamp
}

// Tipos para notificaciones
export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
}