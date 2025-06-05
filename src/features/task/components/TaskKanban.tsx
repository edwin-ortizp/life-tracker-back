import React, { useMemo, useState } from 'react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';
import {
  isBefore,
  startOfDay,
  endOfDay,
  endOfWeek,
  addDays,
  addWeeks
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';


interface TaskKanbanProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove: (taskId: string, dueDate: Date | null) => void;
  onAdd: (dueDate?: Date | null) => void;
}

export const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  onToggle,
  onDelete,
  onEdit,
  onView,
  onMove,
  onAdd
}) => {
  const [dragging, setDragging] = useState<Task | null>(null);
  const groups = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const endWeek = endOfWeek(now);

    const priorityOrder: Record<string, number> = {
      do: 0,
      decide: 1,
      delegate: 2,
      delete: 3,
    };

    const grouped = tasks
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

    Object.values(grouped).forEach(list => {
      list.sort((a, b) => {
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
    });

    return grouped;
  }, [tasks]);

  const columns = [
    { key: 'overdue', title: 'Vencidas' },
    { key: 'today', title: 'Para Hoy' },
    { key: 'thisWeek', title: 'Esta Semana' },
    { key: 'future', title: 'Próximamente' },
    { key: 'noDate', title: 'Sin Fecha' },
  ] as const;

  type ColumnKey = typeof columns[number]['key'];

  const getDateForColumn = (key: ColumnKey): Date | null => {
    const now = new Date();
    switch (key) {
      case 'overdue':
        return addDays(startOfDay(now), -1);
      case 'today':
        return endOfDay(now);
      case 'thisWeek':
        return endOfWeek(now);
      case 'future':
        return addWeeks(now, 1);
      case 'noDate':
      default:
        return null;
    }
  };

  const handleDrop = (col: ColumnKey) => {
    if (dragging) {
      onMove(dragging.id, getDateForColumn(col));
      setDragging(null);
    }
  };

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-4">
      {columns.map(col => (
        <div
          key={col.key}
          className="w-72 flex-shrink-0 space-y-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.key)}
        >
          <div className="flex items-center justify-between pt-4">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">
              {col.title}
            </h3>
            <Button size="icon" variant="ghost" onClick={() => onAdd(getDateForColumn(col.key))}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {groups[col.key].map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={() => setDragging(task)}
              onDragEnd={() => setDragging(null)}
            >
              <TaskItem
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={onView}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TaskKanban;
