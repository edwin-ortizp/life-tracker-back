import React, { useMemo } from 'react';
import { Task } from '../models';
import { TaskItemCalendar } from './TaskItemCalendar';

interface TasksNoDateProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
}

export const TasksNoDate: React.FC<TasksNoDateProps> = ({
  tasks,
  onDelete,
  onEdit,
  onView,
  onMove,
}) => {
  // Filtrar solo tareas sin fecha
  const noDateTasks = useMemo(() => {
    return tasks
      .filter(task => !task.startDate && !task.completed)
      .sort((a, b) => {
        // Ordenar por prioridad y luego por creación
        const priorityOrder = { 'do': 1, 'decide': 2, 'delegate': 3, 'delete': 4 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5;

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
  }, [tasks]);

  if (noDateTasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="sticky top-0 bg-white py-2 z-10">
        <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
          <span>📋</span>
          Sin Fecha ({noDateTasks.length})
        </h3>
      </div>

      <div className="space-y-2">
        {noDateTasks.map((task) => (
          <TaskItemCalendar
            key={task.id}
            task={task}
            onDelete={onDelete}
            onEdit={onEdit}
            onView={onView}
            onMove={onMove}
            showCategoryLabel={true}
          />
        ))}
      </div>
    </div>
  );
};
