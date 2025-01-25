import React from 'react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskGroup: React.FC<TaskGroupProps> = ({ 
  title, 
  tasks, 
  onToggle,
  onDelete,
  onEdit 
}) => {
  if (tasks.length === 0) return null;

  // Ordenar tareas por fecha y creación
  const sortedTasks = tasks.sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    if (!a.dueDate && !b.dueDate) {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    }
    return a.dueDate ? -1 : 1;
  });

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider pt-4">
        {title}
      </h3>
      {sortedTasks.map(task => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};