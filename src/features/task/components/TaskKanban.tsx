import React, { useMemo } from 'react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';
import { isBefore, startOfDay, endOfDay, endOfWeek } from 'date-fns';

interface TaskKanbanProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskKanban: React.FC<TaskKanbanProps> = ({ tasks, onToggle, onDelete, onEdit }) => {
  const groups = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const endWeek = endOfWeek(now);

    return tasks
      .filter(t => !t.isRecurrent)
      .reduce((acc, task) => {
        if (task.dueDate && isBefore(task.dueDate, today)) {
          acc.overdue.push(task);
        } else if (!task.dueDate) {
          acc.noDate.push(task);
        } else if (isBefore(task.dueDate, endToday)) {
          acc.today.push(task);
        } else if (isBefore(task.dueDate, endWeek)) {
          acc.thisWeek.push(task);
        } else {
          acc.future.push(task);
        }
        return acc;
      }, {
        overdue: [] as Task[],
        today: [] as Task[],
        thisWeek: [] as Task[],
        future: [] as Task[],
        noDate: [] as Task[],
      });
  }, [tasks]);

  const columns = [
    { key: 'overdue', title: 'Vencidas' },
    { key: 'today', title: 'Para Hoy' },
    { key: 'thisWeek', title: 'Esta Semana' },
    { key: 'future', title: 'Próximamente' },
    { key: 'noDate', title: 'Sin Fecha' },
  ] as const;

  return (
    <div className="grid md:grid-cols-5 gap-4 overflow-x-auto">
      {columns.map(col => (
        <div key={col.key} className="space-y-3 min-w-[200px]">
          <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider pt-4">
            {col.title}
          </h3>
          {groups[col.key].map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default TaskKanban;
