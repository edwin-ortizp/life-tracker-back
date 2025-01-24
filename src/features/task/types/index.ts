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

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: {
    seconds: number;
  };
  dueDate?: Date;
  isRecurrent?: boolean;
  category: TaskCategory;
  recurrence?: {
    frequency: number;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    customDays?: number;
    nextDate?: Date;
  };
}

export interface TaskProps {
  selectedDate: Date;
}

export interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: TaskFormData) => void;
  task: Task;
  mode: 'complete' | 'edit';
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: Date;
  isRecurrent?: boolean;
  category: TaskCategory;
  recurrence?: {
    frequency: number;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    customDays?: number;
  };
  nextDate?: Date;
}