// src/features/task/types/index.ts
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: {
    seconds: number;
  };
}

export interface TaskProps {
  selectedDate: Date;
}