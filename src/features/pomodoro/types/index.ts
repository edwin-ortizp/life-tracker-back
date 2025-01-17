export interface TimestampWithOffset {
  timestamp: number;
  utcOffset: number;  // en minutos
}

export interface PomodoroSession {
  startTime: TimestampWithOffset;
  endTime: TimestampWithOffset;
  duration: number;
  completed: boolean;
}
  
  export interface PomodoroData {
    userId: string;
    date: string;
    count: number;
    sessions: PomodoroSession[];
    updatedAt: any;
  }
  
  export interface PomodoroStats {
    totalSessions: number;
    completedSessions: number;
    totalTime: number;
    averageSessionTime: number;
    completionRate: number;
    bestDay: {
      date: string;
      sessions: number;
    };
  }