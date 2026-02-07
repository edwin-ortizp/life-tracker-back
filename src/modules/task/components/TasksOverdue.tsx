import React, { useMemo } from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { Task } from '../models';
import { TaskItemCalendar } from './TaskItemCalendar';

interface TasksOverdueProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
}

export const TasksOverdue: React.FC<TasksOverdueProps> = ({
  tasks,
  onDelete,
  onEdit,
  onView,
  onMove,
}) => {
  const today = startOfDay(new Date());

  // Filtrar solo tareas vencidas (startDate < hoy y no completadas)
  const overdueTasks = useMemo(() => {
    return tasks
      .filter(task => {
        if (!task.startDate) return false;
        return isBefore(task.startDate, today) && !task.completed;
      })
      .sort((a, b) => {
        // Ordenar por fecha (más antigua primero)
        if (a.startDate && b.startDate) {
          return a.startDate.getTime() - b.startDate.getTime();
        }
        return 0;
      });
  }, [tasks, today]);

  if (overdueTasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="sticky top-0 bg-white py-2 z-10">
        <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
          <span>🔴</span>
          Tareas Vencidas ({overdueTasks.length})
        </h3>
      </div>

      <div className="space-y-2">
        {overdueTasks.map((task) => (
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
