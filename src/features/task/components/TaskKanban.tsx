import React, { useMemo, useState } from 'react';
import { Task, TASK_CATEGORIES, CATEGORY_LABELS } from '../types';
import { TaskItem } from './TaskItem';
import {
  isBefore,
  startOfDay,
  endOfDay,
  endOfWeek,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  addDays,
  addWeeks
} from 'date-fns';
import { toNoon } from '@/utils/dates';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search, X, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface TaskKanbanProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove: (taskId: string, dueDate: Date | null) => void;
  onAdd: (dueDate?: Date | null) => void;
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'month' | 'overdue' | 'noDate';
const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'Todas las fechas',
  today: 'Hoy',
  tomorrow: 'Mañana',
  week: 'Esta semana',
  month: 'Este mes',
  overdue: 'Vencidas',
  noDate: 'Sin fecha'
};

type PriorityFilter = 'all' | 'do' | 'decide' | 'delegate' | 'delete';
const PRIORITY_LABELS: Record<PriorityFilter, string> = {
  all: 'Todas',
  do: 'do',
  decide: 'decide',
  delegate: 'delegate',
  delete: 'delete'
};

type SizeFilter = 'all' | 'none' | 'pequeña' | 'mediana' | 'grande';
const SIZE_LABELS: Record<SizeFilter, string> = {
  all: 'Todas',
  none: 'Sin tamaño',
  'pequeña': 'pequeña',
  'mediana': 'mediana',
  'grande': 'grande'
};

type BooleanFilter = 'all' | 'yes' | 'no';
const BOOLEAN_LABELS: Record<BooleanFilter, string> = {
  all: 'Todas',
  yes: 'Sí',
  no: 'No'
};

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
  const [selectedCategory, setSelectedCategory] = useState<Task['category'] | 'all'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('today');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'do' | 'decide' | 'delegate' | 'delete'>('all');
  const [selectedSize, setSelectedSize] = useState<SizeFilter>('all');
  const [selectedUrgent, setSelectedUrgent] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedImportant, setSelectedImportant] = useState<'all' | 'yes' | 'no'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exportDateFilter, setExportDateFilter] = useState<DateFilter>('today');

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(t => !t.isRecurrent && !t.isPrivate);

    // Filtro de búsqueda por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === selectedPriority);
    }

    if (selectedSize !== 'all') {
      if (selectedSize === 'none') {
        filtered = filtered.filter(t => !t.size);
      } else {
        filtered = filtered.filter(t => t.size === selectedSize);
      }
    }

    if (selectedUrgent !== 'all') {
      filtered = filtered.filter(t => {
        const urgent = t.priority === 'do' || t.priority === 'delegate';
        return selectedUrgent === 'yes' ? urgent : !urgent;
      });
    }

    if (selectedImportant !== 'all') {
      filtered = filtered.filter(t => {
        const imp = t.priority === 'do' || t.priority === 'decide';
        return selectedImportant === 'yes' ? imp : !imp;
      });
    }

    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const tomorrowStart = addDays(today, 1);
    const tomorrowEnd = endOfDay(tomorrowStart);

    switch (selectedDateFilter) {
      case 'today':
        return filtered.filter(task =>
          task.dueDate && isWithinInterval(task.dueDate, { start: today, end: endOfDay(now) })
        );
      case 'tomorrow':
        return filtered.filter(task =>
          task.dueDate && isWithinInterval(task.dueDate, { start: tomorrowStart, end: tomorrowEnd })
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
        return filtered.filter(task => task.dueDate && isBefore(task.dueDate, today));
      case 'noDate':
        return filtered.filter(task => !task.dueDate);
      default:
        return filtered;
    }
  }, [tasks, selectedCategory, selectedPriority, selectedSize, selectedUrgent, selectedImportant, selectedDateFilter, searchQuery]);

  // Función para determinar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedCategory !== 'all' ||
      selectedDateFilter !== 'today' ||  // 'today' es el filtro por defecto
      selectedPriority !== 'all' ||
      selectedSize !== 'all' ||
      selectedUrgent !== 'all' ||
      selectedImportant !== 'all'
    );
  }, [searchQuery, selectedCategory, selectedDateFilter, selectedPriority, selectedSize, selectedUrgent, selectedImportant]);

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDateFilter('today');
    setSelectedPriority('all');
    setSelectedSize('all');
    setSelectedUrgent('all');
    setSelectedImportant('all');
  };

  const groups = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const tomorrow = addDays(startOfDay(now), 1);
    const endTomorrow = endOfDay(tomorrow);
    const endWeek = endOfWeek(now);

    const priorityOrder: Record<string, number> = {
      do: 0,
      decide: 1,
      delegate: 2,
      delete: 3,
    };

    const grouped = filteredTasks
      .reduce((acc, task) => {
        if (task.dueDate && isBefore(task.dueDate, today)) {
          acc.overdue.push(task);
        } else if (!task.dueDate) {
          acc.noDate.push(task);
        } else if (isBefore(task.dueDate, endToday)) {
          acc.today.push(task);
        } else if (isBefore(task.dueDate, endTomorrow)) {
          acc.tomorrow.push(task);
        } else if (isBefore(task.dueDate, endWeek)) {
          acc.thisWeek.push(task);
        } else {
          acc.future.push(task);
        }
        return acc;
      }, {
        overdue: [] as Task[],
        today: [] as Task[],
        tomorrow: [] as Task[],
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
  }, [filteredTasks]);

  const filterTasksByDate = (list: Task[], filter: DateFilter) => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const tomorrowStart = addDays(today, 1);
    const tomorrowEnd = endOfDay(tomorrowStart);

    switch (filter) {
      case 'today':
        return list.filter(t =>
          t.dueDate && isWithinInterval(t.dueDate, { start: today, end: endOfDay(now) })
        );
      case 'tomorrow':
        return list.filter(t =>
          t.dueDate && isWithinInterval(t.dueDate, { start: tomorrowStart, end: tomorrowEnd })
        );
      case 'week':
        return list.filter(t =>
          t.dueDate && isWithinInterval(t.dueDate, { start: weekStart, end: weekEnd })
        );
      case 'month':
        return list.filter(t =>
          t.dueDate && isWithinInterval(t.dueDate, { start: monthStart, end: monthEnd })
        );
      case 'overdue':
        return list.filter(t => t.dueDate && isBefore(t.dueDate, today));
      case 'noDate':
        return list.filter(t => !t.dueDate);
      default:
        return list;
    }
  };

  const columns = [
    { key: 'overdue', title: 'Vencidas' },
    { key: 'today', title: 'Para Hoy' },
    { key: 'tomorrow', title: 'Mañana' },
    { key: 'thisWeek', title: 'Esta Semana' },
    { key: 'future', title: 'Próximamente' },
    { key: 'noDate', title: 'Sin Fecha' },
  ] as const;

  type ColumnKey = typeof columns[number]['key'];

  const getDateForColumn = (key: ColumnKey): Date | null => {
    const now = new Date();
    switch (key) {
      case 'overdue':
        return toNoon(addDays(startOfDay(now), -1));
      case 'today':
        return toNoon(now);
      case 'tomorrow':
        return toNoon(addDays(startOfDay(now), 1));
      case 'thisWeek':
        return toNoon(endOfWeek(now));
      case 'future':
        return toNoon(addWeeks(now, 1));
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

  const handleCopyTasks = () => {
    const list = filterTasksByDate(tasks, exportDateFilter);
    const exportData = list.map(t => ({
      nombre: t.title,
      descripción: t.description || ''
    }));
    const jsonString = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast.success('Tareas copiadas al portapapeles');
    });
  };

  return (
    <div className="space-y-3">
      {/* Buscador y botón de filtros para móvil */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar tareas por nombre..."
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
      </div>

      {/* Filtros - Disposición más compacta en una línea */}
      <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="flex flex-wrap items-end gap-3 md:gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">Categoría</span>
            <Select value={selectedCategory} onValueChange={v => setSelectedCategory(v as Task['category'] | 'all')}>
              <SelectTrigger className={`w-32 ${selectedCategory !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
                <SelectValue>{selectedCategory === 'all' ? 'Todas' : CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.values(TASK_CATEGORIES).map(cat => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">Fecha</span>
            <Select value={selectedDateFilter} onValueChange={v => setSelectedDateFilter(v as DateFilter)}>
              <SelectTrigger className={`w-32 ${selectedDateFilter !== 'today' ? 'border-blue-500 bg-blue-50' : ''}`}>
                <SelectValue>{DATE_FILTER_LABELS[selectedDateFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATE_FILTER_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">Prioridad</span>
            <Select value={selectedPriority} onValueChange={v => setSelectedPriority(v as PriorityFilter)}>
              <SelectTrigger className={`w-24 ${selectedPriority !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
                <SelectValue>{PRIORITY_LABELS[selectedPriority]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">Tamaño</span>
            <Select value={selectedSize} onValueChange={v => setSelectedSize(v as SizeFilter)}>
              <SelectTrigger className={`w-24 ${selectedSize !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
                <SelectValue>{SIZE_LABELS[selectedSize]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SIZE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">Urgente</span>
            <Select value={selectedUrgent} onValueChange={v => setSelectedUrgent(v as BooleanFilter)}>
              <SelectTrigger className={`w-20 ${selectedUrgent !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
                <SelectValue>{BOOLEAN_LABELS[selectedUrgent]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BOOLEAN_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">Importante</span>
            <Select value={selectedImportant} onValueChange={v => setSelectedImportant(v as BooleanFilter)}>
              <SelectTrigger className={`w-20 ${selectedImportant !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}>
                <SelectValue>{BOOLEAN_LABELS[selectedImportant]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BOOLEAN_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Copiar tareas por fecha */}
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">Exportar</span>
              <div className="flex gap-1">
                <Select value={exportDateFilter} onValueChange={v => setExportDateFilter(v as DateFilter)}>
                  <SelectTrigger className="w-32">
                    <SelectValue>{DATE_FILTER_LABELS[exportDateFilter]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATE_FILTER_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyTasks}
                  className="flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex flex-col lg:flex-row items-start gap-2 lg:gap-4 overflow-x-auto pb-2 p-2 lg:p-3 rounded bg-gradient-to-br from-blue-50 via-indigo-50 to-indigo-100">
        {columns.map(col => (
          <div
            key={col.key}
            className="w-full lg:w-[16rem] xl:w-[18rem] lg:flex-shrink-0 space-y-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
          >
            <div className="flex items-center justify-between pt-2">
              <h3 className="font-medium text-xs lg:text-sm text-gray-500 uppercase tracking-wider">
                {col.title}
              </h3>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => onAdd(getDateForColumn(col.key))} className="h-6 w-6 lg:h-8 lg:w-8">
                  <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                </Button>
              </div>
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
                  onMove={onMove}
                  variant="kanban"
                  showCategoryLabel={selectedCategory === 'all'}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskKanban;