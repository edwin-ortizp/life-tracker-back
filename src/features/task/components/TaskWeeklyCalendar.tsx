import React, { useState, useMemo } from 'react';
import {
  startOfDay,
  endOfDay,
  addDays,
  isBefore
} from 'date-fns';
import { Task, TimeOfDay, TIME_OF_DAY_LABELS } from '../types';
import { TaskItemCalendar } from './TaskItemCalendar';
import { UnassignedTaskItem } from './UnassignedTaskItem';
import { Search, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';

interface TaskWeeklyCalendarProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onAssignTimeOfDay: (id: string, slot: TimeOfDay) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const slots: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

export const TaskWeeklyCalendar: React.FC<TaskWeeklyCalendarProps> = ({ 
  tasks, 
  onDelete, 
  onEdit, 
  onView, 
  onAssignTimeOfDay, 
  onMove, 
  searchQuery: externalSearchQuery,
  onSearchChange
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  
  // Use external search query if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;
  
  const today = startOfDay(new Date());
  const endToday = endOfDay(today);
  const tomorrow = addDays(today, 1);
  const endTomorrow = endOfDay(tomorrow);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query))
    );
  }, [tasks, searchQuery]);

  const byColumn: Record<'overdue' | 'today' | 'tomorrow' | 'future', Record<TimeOfDay, Task[]>> = {
    overdue: { morning: [], afternoon: [], evening: [] },
    today: { morning: [], afternoon: [], evening: [] },
    tomorrow: { morning: [], afternoon: [], evening: [] },
    future: { morning: [], afternoon: [], evening: [] }
  };

  const unassigned: Task[] = [];

  // Función para ordenar tareas por prioridad
  const sortByPriority = (tasks: Task[]): Task[] => {
    const priorityOrder = { 'do': 1, 'decide': 2, 'delegate': 3, 'delete': 4, 'none': 5 };
    return tasks.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5;
      return aPriority - bPriority;
    });
  };

  filteredTasks.forEach(t => {
    if (!t.dueDate) {
      unassigned.push(t);
      return;
    }

    if (!t.timeOfDay) {
      unassigned.push(t);
      return;
    }

    if (isBefore(t.dueDate, today)) {
      byColumn.overdue[t.timeOfDay].push(t);
    } else if (isBefore(t.dueDate, endToday)) {
      byColumn.today[t.timeOfDay].push(t);
    } else if (isBefore(t.dueDate, endTomorrow)) {
      byColumn.tomorrow[t.timeOfDay].push(t);
    } else {
      byColumn.future[t.timeOfDay].push(t);
    }
  });

  // Ordenar todas las tareas por prioridad dentro de cada slot
  Object.keys(byColumn).forEach(columnKey => {
    const column = byColumn[columnKey as keyof typeof byColumn];
    Object.keys(column).forEach(slotKey => {
      column[slotKey as TimeOfDay] = sortByPriority(column[slotKey as TimeOfDay]);
    });
  });

  // Calcular resumen por columna
  const getColumnSummary = (column: Record<TimeOfDay, Task[]>) => {
    const morningCount = column.morning.length;
    const afternoonCount = column.afternoon.length;
    const eveningCount = column.evening.length;
    const totalTasks = morningCount + afternoonCount + eveningCount;
    
    const totalEstimatedTime = slots.reduce((total, slot) => {
      return total + column[slot].reduce((slotTotal, task) => {
        return slotTotal + (task.estimatedTime || 0);
      }, 0);
    }, 0);

    return {
      morningCount,
      afternoonCount,
      eveningCount,
      totalTasks,
      totalEstimatedTime
    };
  };

  // Filter unassigned tasks to only show those without timeOfDay
  const unassignedWithoutTimeOfDay = unassigned.filter(t => !t.timeOfDay);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar tareas por nombre o descripción..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Calendar */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex gap-3 min-w-fit pb-2">
        {(
          [
            { key: 'overdue', label: 'Vencidas' },
            { key: 'today', label: 'Hoy' },
            { key: 'tomorrow', label: 'Mañana' },
            { key: 'future', label: 'Futuras' }
          ] as const
        ).map(({ key, label }) => {
          const summary = getColumnSummary(byColumn[key]);
          return (
          <div key={key} className="w-[500px] flex-shrink-0 space-y-2">
            <div className="text-center sticky top-0 bg-white py-1 z-10 space-y-1">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-gray-600 space-y-0.5">
                <div className="flex justify-center gap-3">
                  <span>🌅 {summary.morningCount}</span>
                  <span>🏙️ {summary.afternoonCount}</span>
                  <span>🌙 {summary.eveningCount}</span>
                </div>
                <div className="text-[10px] text-gray-500">
                  Total: {summary.totalTasks} tareas • {summary.totalEstimatedTime}min
                </div>
              </div>
            </div>
            {slots.map((slot) => (
              <div key={slot} className="min-h-[3rem] border rounded p-2 space-y-1 bg-white">
                <div className="text-xs font-semibold text-gray-500">
                  {TIME_OF_DAY_LABELS[slot]}
                </div>
                {byColumn[key][slot].map((task) => (
                  <TaskItemCalendar
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
            ))}
          </div>
          );
        })}
        {unassignedWithoutTimeOfDay.length > 0 && (
          <div className="w-[500px] flex-shrink-0 space-y-2">
            <h3 className="text-sm font-medium text-center sticky top-0 bg-white py-1 z-10">Sin asignar</h3>
            <div className="min-h-[3rem] border rounded p-2 space-y-1 bg-white">
              {unassignedWithoutTimeOfDay.map((task) => (
                <UnassignedTaskItem
                  key={task.id}
                  task={task}
                  onView={onView}
                  onAssign={onAssignTimeOfDay}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TaskWeeklyCalendar;
