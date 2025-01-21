// src/features/task/components/TaskList.tsx
import React from 'react';
import { CheckCircle2, Circle, X } from 'lucide-react';
import type { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggle,
  onDelete
}) => {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
        >
          <button
            onClick={() => onToggle(task.id, task.completed)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <span className={task.completed ? 'line-through text-gray-400' : ''}>
            {task.title}
          </span>
          <button
            onClick={() => onDelete(task.id)}
            className="ml-auto p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  );
};