import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, TASK_CATEGORIES, CATEGORY_LABELS } from '../types';
import { TaskGroup } from './TaskGroup';
import { 
  isBefore, 
  isAfter, 
  startOfDay, 
  endOfDay, 
  endOfWeek,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval
} from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'overdue' | 'noDate';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'Todas las fechas',
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  overdue: 'Vencidas',
  noDate: 'Sin fecha'
};

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggle,
  onDelete,
  onEdit
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar tareas por categoría y fecha
  const filteredTasks = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? tasks 
      : tasks.filter(task => task.category === selectedCategory);

    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    switch (selectedDateFilter) {
      case 'today':
        return filtered.filter(task => 
          task.dueDate && isWithinInterval(task.dueDate, { start: today, end: endOfDay(now) })
        );
      case 'week':
        return filtered.filter(task => 
          task.dueDate && isWithinInterval(task.dueDate, { start: weekStart, end: weekEnd })
        );
      case 'month':
        return filtered.filter(task => 
          task.dueDate && isWithinInterval(task.dueDate, { start: monthStart, end: monthEnd })
        );
      case 'overdue':
        return filtered.filter(task => 
          task.dueDate && isBefore(task.dueDate, today)
        );
      case 'noDate':
        return filtered.filter(task => !task.dueDate);
      default:
        return filtered;
    }
  }, [tasks, selectedCategory, selectedDateFilter]);

  // Agrupar tareas
  const groupedTasks = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const endWeek = endOfWeek(now);

    return filteredTasks.reduce((groups, task) => {
      if (task.dueDate && isBefore(task.dueDate, today)) {
        groups.overdue.push(task);
      } else if (!task.dueDate) {
        groups.noDate.push(task);
      } else if (isBefore(task.dueDate, endToday)) {
        groups.today.push(task);
      } else if (isBefore(task.dueDate, endWeek)) {
        groups.thisWeek.push(task);
      } else {
        groups.future.push(task);
      }
      return groups;
    }, {
      overdue: [] as Task[],
      today: [] as Task[],
      thisWeek: [] as Task[],
      future: [] as Task[],
      noDate: [] as Task[]
    });
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      {/* Botón de filtros móvil */}
      {/* The parent div with md:hidden is kept as is. Button itself is also md:hidden to avoid rendering it on larger screens where filters are visible. */}
      <div className="md:hidden">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between" // md:hidden is not needed here if parent div handles it
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </span>
          <span className="text-sm text-muted-foreground"> {/* Changed text-gray-500 */}
            {selectedCategory !== 'all' && CATEGORY_LABELS[selectedCategory as TaskCategory]}
            {selectedCategory !== 'all' && selectedDateFilter !== 'all' && ' • '}
            {selectedDateFilter !== 'all' && DATE_FILTER_LABELS[selectedDateFilter]}
          </span>
        </Button>
      </div>

      {/* Filtros */}
      <div className={`space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 ${showFilters ? 'block' : 'hidden md:flex'}`}>
        <div className="flex-1 space-y-2 md:space-y-0">
          <span className="text-sm text-gray-500 font-medium block md:inline md:mr-2">Categoría:</span>
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as TaskCategory | 'all')}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue>
                {selectedCategory === 'all' ? 'Todas las categorías' : CATEGORY_LABELS[selectedCategory as TaskCategory]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {Object.entries(TASK_CATEGORIES).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {CATEGORY_LABELS[value as TaskCategory]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2 md:space-y-0">
          <span className="text-sm text-gray-500 font-medium block md:inline md:mr-2">Fecha:</span>
          <Select
            value={selectedDateFilter}
            onValueChange={(value) => setSelectedDateFilter(value as DateFilter)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue>
                {DATE_FILTER_LABELS[selectedDateFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_FILTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de tareas */}
      <div>
        <TaskGroup 
          title="Tareas Vencidas" 
          tasks={groupedTasks.overdue} 
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
        <TaskGroup 
          title="Para Hoy" 
          tasks={groupedTasks.today}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
        <TaskGroup 
          title="Esta Semana" 
          tasks={groupedTasks.thisWeek}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
        <TaskGroup 
          title="Próximamente" 
          tasks={groupedTasks.future}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
        <TaskGroup 
          title="Sin Fecha" 
          tasks={groupedTasks.noDate}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />

        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {selectedCategory === 'all' && selectedDateFilter === 'all'
              ? 'No hay tareas pendientes'
              : 'No hay tareas pendientes con los filtros seleccionados'
            }
          </div>
        )}
      </div>
    </div>
  );
};