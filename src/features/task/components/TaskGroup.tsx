import React from 'react';
import { Task } from '../types';
import { TaskItemList } from './TaskItemList';

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  onAssignTimeOfDay?: (taskId: string, timeOfDay: any) => void;
}

export const TaskGroup: React.FC<TaskGroupProps> = ({ 
  title, 
  tasks, 
  onDelete,
  onEdit,
  onView,
  onMove,
  onAssignTimeOfDay
}) => {
  if (tasks.length === 0) return null;

  const priorityOrder: Record<string, number> = {
    do: 0,
    decide: 1,
    delegate: 2,
    delete: 3,
  };

  // Ordenar tareas por prioridad y luego por fecha
  const sortedTasks = tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority || 'none'] ?? 4;
    const pb = priorityOrder[b.priority || 'none'] ?? 4;
    if (pa !== pb) return pa - pb;
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
        <TaskItemList
          key={task.id}
          task={task}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
          onMove={onMove}
          onAssignTimeOfDay={onAssignTimeOfDay}
        />
      ))}
    </div>
  );
};