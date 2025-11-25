import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, TASK_CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { TasksOverdue } from './TasksOverdue';
import { TasksTodayCalendar } from './TasksTodayCalendar';
import { TasksFuture } from './TasksFuture';
import { TasksNoDate } from './TasksNoDate';
import { Search, X, Tag, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

interface TaskWeeklyCalendarProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onQuickUpdate?: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
  onToggle?: (taskId: string, completed: boolean) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategories?: TaskCategory[];
  onCategoriesChange?: (categories: TaskCategory[]) => void;
}

export const TaskWeeklyCalendar: React.FC<TaskWeeklyCalendarProps> = ({
  tasks,
  onDelete,
  onEdit,
  onQuickUpdate,
  onView,
  onMove,
  onToggle,
  searchQuery: externalSearchQuery,
  onSearchChange,
  selectedCategories: externalCategories,
  onCategoriesChange
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [internalCategories, setInternalCategories] = useState<TaskCategory[]>([]);

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;

  const selectedCategories = externalCategories !== undefined ? externalCategories : internalCategories;
  const setSelectedCategories = onCategoriesChange || setInternalCategories;

  // Helper para toggle de categoría
  const toggleCategory = (category: TaskCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
  };

  // Helper para remover categoría
  const removeCategory = (category: TaskCategory) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };

  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let overdue = 0;
    let todayCount = 0;
    let future = 0;
    let noDate = 0;

    tasks.forEach(task => {
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
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 bg-white z-20 pb-4 space-y-3">
        {/* Filtros de Búsqueda y Categoría */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
          {/* Caja de Búsqueda */}
          <div className="relative flex-1 max-w-md w-full">
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

          {/* Filtro de Categorías - Badges + Popover */}
          <div className="flex flex-wrap items-center gap-2 sm:w-auto w-full">
            {/* Badges de categorías seleccionadas */}
            {selectedCategories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className={cn(
                  "flex items-center gap-1 pr-1 cursor-pointer hover:opacity-80 transition-opacity",
                  CATEGORY_COLORS[category].bg,
                  CATEGORY_COLORS[category].text
                )}
              >
                <span className="text-xs">{CATEGORY_LABELS[category]}</span>
                <button
                  onClick={() => removeCategory(category)}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  title={`Quitar ${CATEGORY_LABELS[category]}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}

            {/* Popover para agregar categorías */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 gap-1",
                    selectedCategories.length > 0 && "border-blue-500"
                  )}
                >
                  <Filter className="w-3 h-3" />
                  <span className="text-xs">
                    {selectedCategories.length > 0 ? `Categorías (${selectedCategories.length})` : 'Categorías'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Filtrar por categoría
                  </div>
                  {Object.entries(TASK_CATEGORIES).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                    >
                      <Checkbox
                        checked={selectedCategories.includes(value as TaskCategory)}
                        onCheckedChange={() => toggleCategory(value as TaskCategory)}
                      />
                      <span className="text-sm flex-1">{CATEGORY_LABELS[value as TaskCategory]}</span>
                      <div
                        className={cn("w-3 h-3 rounded", CATEGORY_COLORS[value as TaskCategory].bg)}
                        title={CATEGORY_LABELS[value as TaskCategory]}
                      />
                    </label>
                  ))}
                  {selectedCategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-xs"
                      onClick={() => setSelectedCategories([])}
                    >
                      Limpiar todo
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Fila de Estadísticas */}
        <div className="flex flex-wrap gap-3 text-xs">
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
                tasks={tasks}
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
                tasks={tasks}
                onDelete={onDelete}
                onEdit={onEdit}
                onQuickUpdate={onQuickUpdate}
                onView={onView}
                onMove={onMove}
                onToggle={onToggle}
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
                tasks={tasks}
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
                  tasks={tasks}
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

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">
            No se encontraron tareas con los filtros aplicados
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskWeeklyCalendar;
