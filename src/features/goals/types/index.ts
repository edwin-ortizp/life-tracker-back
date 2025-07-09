export interface GoalTask {
  title: string;
  done: boolean;
  createdAt?: string;
  completedAt?: string | null;
}

export interface GoalEntry {
  text: string;
  date: string;
  isMilestone?: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'abandoned';
  startDate?: string | null;
  dueDate?: string | null;
  tasks: GoalTask[];
  entries: GoalEntry[];
  positiveCount?: number;
  negativeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalsHook {
  goals: Goal[];
  status: 'idle' | 'loading' | 'saving' | 'error';
  error: string | null;
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  addTask: (goalId: string, taskTitle: string) => Promise<void>;
  toggleTask: (goalId: string, taskIndex: number) => Promise<void>;
  addEntry: (goalId: string, entry: Omit<GoalEntry, 'date'> & { date?: string }) => Promise<void>;
  incrementPositiveCount: (goalId: string) => Promise<void>;
  incrementNegativeCount: (goalId: string) => Promise<void>;
  loadGoals: () => Promise<void>;
}
