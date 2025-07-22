// src/features/task/types/index.ts

export const TASK_CATEGORIES = {
  PERSONAL: 'personal',
  WORK: 'work',
  HOME: 'home',
  HEALTH: 'health',
  SHOPPING: 'shopping',
  STUDY: 'study',
  SOCIAL: 'social',
  OTHER: 'other'
} as const;

export type TaskCategory = typeof TASK_CATEGORIES[keyof typeof TASK_CATEGORIES];

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  personal: 'Personal',
  work: 'Trabajo',
  home: 'Casa',
  health: 'Salud',
  shopping: 'Compras',
  study: 'Estudio',
  social: 'Social',
  other: 'Otro'
};

export const CATEGORY_COLORS: Record<TaskCategory, { bg: string, text: string }> = {
  personal: { bg: 'bg-purple-100', text: 'text-purple-700' },
  work: { bg: 'bg-blue-100', text: 'text-blue-700' },
  home: { bg: 'bg-green-100', text: 'text-green-700' },
  health: { bg: 'bg-red-100', text: 'text-red-700' },
  shopping: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  study: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  social: { bg: 'bg-pink-100', text: 'text-pink-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' }
};

export const TIME_OF_DAY = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening'
} as const;

export type TimeOfDay = typeof TIME_OF_DAY[keyof typeof TIME_OF_DAY];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche'
};

export interface Task {
  id: string;
  taskCode: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: {
    seconds: number;
  };
  updatedAt?: Date;
  dueDate?: Date;
  isRecurrent?: boolean;
  isPrivate?: boolean;
  category: TaskCategory;
  recurrence?: {
    frequency: number;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    customDays?: number;
    nextDate?: Date;
  };
  priority?: 'do' | 'decide' | 'delegate' | 'delete';
  size?: 'pequeña' | 'mediana' | 'grande';
  estimatedTime?: number;
  timeOfDay?: TimeOfDay;
  progress?: number;
  elapsedSeconds?: number;
  // Timer-related fields
  timerStartTime?: {
    timestamp: number;
    formatted: string;
    date: string;
    hour: number;
    minute: number;
  };
  timerPaused?: boolean;
  pausedDuration?: number;
  timerActive?: boolean;
}

export interface TaskProps {
  selectedDate?: Date;
  showFloatingButton?: boolean;
}

export interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: TaskFormData) => void;
  task: Task;
  mode: 'create' | 'complete' | 'edit';
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: Date;
  isRecurrent?: boolean;
  isPrivate?: boolean;
  category: TaskCategory;
  taskCode?: number;
  recurrence?: {
    frequency: number;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    customDays?: number;
  };
  nextDate?: Date;
  priority?: 'do' | 'decide' | 'delegate' | 'delete';
  size?: 'peque\u00f1a' | 'mediana' | 'grande';
  estimatedTime?: number;
  timeOfDay?: TimeOfDay;
  elapsedSeconds?: number;
  // Timer-related fields
  timerStartTime?: {
    timestamp: number;
    formatted: string;
    date: string;
    hour: number;
    minute: number;
  };
  timerPaused?: boolean;
  pausedDuration?: number;
  timerActive?: boolean;
}