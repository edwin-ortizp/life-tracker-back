// src/features/task/types/index.ts
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
  onConfirm: (data: {
    title: string;
    description?: string;
    dueDate?: Date;
    isRecurrent?: boolean;
    recurrence?: {
      frequency: number;
      pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
      customDays?: number;
    };
  }) => void;
  task: Task;
  mode: 'complete' | 'edit';
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: Date;
  isRecurrent?: boolean;
  recurrence?: {
    frequency: number;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    customDays?: number;
  };
}