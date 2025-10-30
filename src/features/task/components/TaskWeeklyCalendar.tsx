import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { TasksOverdue } from './TasksOverdue';
import { TasksTodayCalendar } from './TasksTodayCalendar';
import { TasksFuture } from './TasksFuture';
import { TasksNoDate } from './TasksNoDate';
import { Search, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';

interface TaskWeeklyCalendarProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onQuickUpdate?: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const TaskWeeklyCalendar: React.FC<TaskWeeklyCalendarProps> = ({
  tasks,
  onDelete,
  onEdit,
  onQuickUpdate,
  onView,
  onMove,
  searchQuery: externalSearchQuery,
  onSearchChange
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;

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

  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let overdue = 0;
    let todayCount = 0;
    let future = 0;
    let noDate = 0;

    filteredTasks.forEach(task => {
      if (!task.startDate) {
        noDate++;
        return;
      }

      const taskDate = new Date(task.startDate);
      const taskDateStart = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

      if (taskDateStart < todayStart) {
        overdue++;
      } else if (taskDateStart.getTime() === todayStart.getTime()) {
        todayCount++;
      } else {
        future++;
      }
    });

    return { overdue, todayCount, future, noDate };
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 bg-white z-20 pb-4">
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

        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {stats.overdue > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <span className="font-semibold">{stats.overdue}</span> vencidas
            </div>
          )}
          {stats.todayCount > 0 && (
            <div className="flex items-center gap-1 text-blue-600">
              <span className="font-semibold">{stats.todayCount}</span> hoy
            </div>
          )}
          {stats.future > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <span className="font-semibold">{stats.future}</span> futuras
            </div>
          )}
          {stats.noDate > 0 && (
            <div className="flex items-center gap-1 text-gray-500">
              <span className="font-semibold">{stats.noDate}</span> sin fecha
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex flex-col md:flex-row gap-4 min-w-fit">
          <div className="flex-1 md:min-w-[300px] lg:min-w-[350px]">
            <div className="border rounded-lg p-4 bg-red-50/50 h-full">
              <TasksOverdue
                tasks={filteredTasks}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={onView}
                onMove={onMove}
              />
              {stats.overdue === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No hay tareas vencidas
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 md:min-w-[400px] lg:min-w-[500px]">
            <div className="border rounded-lg p-4 bg-blue-50/50 h-full">
              <TasksTodayCalendar
                tasks={filteredTasks}
                onDelete={onDelete}
                onEdit={onEdit}
                onQuickUpdate={onQuickUpdate}
                onView={onView}
                onMove={onMove}
              />
              {stats.todayCount === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No hay tareas para hoy
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 md:min-w-[300px] lg:min-w-[350px]">
            <div className="border rounded-lg p-4 bg-green-50/50 h-full">
              <TasksFuture
                tasks={filteredTasks}
                onDelete={onDelete}
                onEdit={onEdit}
                onView={onView}
                onMove={onMove}
              />
              {stats.future === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No hay tareas futuras
                </div>
              )}
            </div>
          </div>

          {stats.noDate > 0 && (
            <div className="flex-1 md:min-w-[300px] lg:min-w-[350px]">
              <div className="border rounded-lg p-4 bg-gray-50/50 h-full">
                <TasksNoDate
                  tasks={filteredTasks}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onView={onView}
                  onMove={onMove}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">
            {searchQuery
              ? `No se encontraron tareas con "${searchQuery}"`
              : 'No hay tareas para mostrar'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskWeeklyCalendar;
