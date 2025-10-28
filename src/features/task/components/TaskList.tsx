import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, TASK_CATEGORIES, CATEGORY_LABELS } from '../types';
import { TaskGroup } from './TaskGroup';
import { 
  isBefore, 
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
import { Filter, Search, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';

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
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, startDate: Date | null) => void;
  onAssignTimeOfDay?: (taskId: string, timeOfDay: any) => void;
  status?: 'idle' | 'loading' | 'saving' | 'pending' | 'saved' | 'error';
  error?: string | null;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onDelete,
  onEdit,
  onView,
  onMove,
  onAssignTimeOfDay,
  status,
  error
}) => {  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Filtrar tareas por categoría, fecha y búsqueda
  const filteredTasks = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? tasks 
      : tasks.filter(task => task.category === selectedCategory);

    // Filtro de búsqueda por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    switch (selectedDateFilter) {
      case 'today':
        return filtered.filter(task => 
          task.startDate && isWithinInterval(task.startDate, { start: today, end: endOfDay(now) })
        );
      case 'week':
        return filtered.filter(task => 
          task.startDate && isWithinInterval(task.startDate, { start: weekStart, end: weekEnd })
        );
      case 'month':
        return filtered.filter(task => 
          task.startDate && isWithinInterval(task.startDate, { start: monthStart, end: monthEnd })
        );
      case 'overdue':
        return filtered.filter(task => 
          task.startDate && isBefore(task.startDate, today)
        );
      case 'noDate':
        return filtered.filter(task => !task.startDate);
      default:
        return filtered;
    }
  }, [tasks, selectedCategory, selectedDateFilter, searchQuery]);

  // Función para determinar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedCategory !== 'all' ||
      selectedDateFilter !== 'all'
    );
  }, [searchQuery, selectedCategory, selectedDateFilter]);

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDateFilter('all');
  };

  // Agrupar tareas
  const groupedTasks = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const endWeek = endOfWeek(now);

    return filteredTasks.reduce((groups, task) => {
      if (task.startDate && isBefore(task.startDate, today)) {
        groups.overdue.push(task);
      } else if (!task.startDate) {
        groups.noDate.push(task);
      } else if (isBefore(task.startDate, endToday)) {
        groups.today.push(task);
      } else if (isBefore(task.startDate, endWeek)) {
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

  return (    <div className="space-y-6">
      {/* Buscador y botón de filtros para móvil */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
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

        {/* Botón de filtros para móvil con indicador */}
        <div className="md:hidden flex gap-2">
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-medium">
                Activos
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Botón limpiar filtros para desktop */}
        <div className="hidden md:flex">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>      {/* Filtros */}
      <div className={`space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 ${showFilters ? 'block' : 'hidden md:flex'}`}>
        <div className="flex-1 space-y-2 md:space-y-0">
          <span className="text-sm text-gray-500 font-medium block md:inline md:mr-2">Categoría:</span>
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as TaskCategory | 'all')}
          >
            <SelectTrigger className={`w-full md:w-[180px] ${selectedCategory !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
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
            <SelectTrigger className={`w-full md:w-[180px] ${selectedDateFilter !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
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
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
          onMove={onMove}
          onAssignTimeOfDay={onAssignTimeOfDay}
        />
        <TaskGroup
          title="Para Hoy"
          tasks={groupedTasks.today}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
          onMove={onMove}
          onAssignTimeOfDay={onAssignTimeOfDay}
        />
        <TaskGroup
          title="Esta Semana"
          tasks={groupedTasks.thisWeek}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
          onMove={onMove}
          onAssignTimeOfDay={onAssignTimeOfDay}
        />
        <TaskGroup
          title="Próximamente"
          tasks={groupedTasks.future}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
          onMove={onMove}
          onAssignTimeOfDay={onAssignTimeOfDay}
        />
        <TaskGroup
          title="Sin Fecha"
          tasks={groupedTasks.noDate}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
          onMove={onMove}
          onAssignTimeOfDay={onAssignTimeOfDay}
        />

        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {selectedCategory === 'all' && selectedDateFilter === 'all'
              ? 'No hay tareas pendientes'
              : 'No hay tareas pendientes con los filtros seleccionados'
            }
          </div>
        )}

        {/* Indicador de estado opcional */}
        {(status && status !== 'idle') && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              {status === 'loading' && (
                <>
                  <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>Cargando tareas...</span>
                </>
              )}
              {status === 'saving' && (
                <>
                  <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              )}
              {status === 'pending' && (
                <span className="text-yellow-600">Pendiente de sincronizar</span>
              )}
              {status === 'saved' && (
                <span className="text-green-600">✓ Sincronizado</span>
              )}
              {status === 'error' && error && (
                <span className="text-red-600">⚠ Error de sincronización</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};