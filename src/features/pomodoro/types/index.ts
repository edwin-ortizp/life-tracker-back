export interface PomodoroSession {
    startTime: string;
    endTime: string;
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