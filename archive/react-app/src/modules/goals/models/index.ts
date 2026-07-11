export interface GoalTask {
  id?: string;
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

export interface NumericGoal {
  enabled: boolean;
  targetValue: number;
  currentValue: number;
  unit: string;
  unitType: 'currency' | 'weight' | 'quantity' | 'percentage' | 'custom';
}

export interface NumericEntry {
  value: number;
  date: string;
  note?: string;
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
  numericGoal?: NumericGoal;
  numericEntries?: NumericEntry[];
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
  toggleTask: (goalId: string, taskId: string | undefined, taskIndex: number) => Promise<void>;
  editTask: (goalId: string, taskId: string, title: string) => Promise<void>;
  deleteTask: (goalId: string, taskId: string) => Promise<void>;
  addEntry: (goalId: string, entry: Omit<GoalEntry, 'date'> & { date?: string }) => Promise<void>;
  incrementPositiveCount: (goalId: string) => Promise<void>;
  incrementNegativeCount: (goalId: string) => Promise<void>;
  addNumericEntry: (goalId: string, entry: Omit<NumericEntry, 'date'> & { date?: string }) => Promise<void>;
  loadGoals: () => Promise<void>;
}
