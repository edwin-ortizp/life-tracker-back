// src/features/task/hooks/useTaskFilters.ts
import { useState, useMemo } from 'react';
import {
  isBefore,
  startOfDay,
  endOfDay,
  endOfWeek,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  addDays
} from 'date-fns';
import type { Task } from '../types';

export type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'month' | 'overdue' | 'noDate';
export type PriorityFilter = 'all' | 'do' | 'decide' | 'delegate' | 'delete';
export type SizeFilter = 'all' | 'none' | 'pequeña' | 'mediana' | 'grande';
export type BooleanFilter = 'all' | 'yes' | 'no';
export type TimeFilter = 'all' | 't60' | 't120' | 't180' | 'none';
export type SortBy = 'default' | 'priorityAsc' | 'priorityDesc' | 'durationAsc' | 'durationDesc';

export const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'Todas las fechas',
  today: 'Hoy',
  tomorrow: 'Mañana',
  week: 'Esta semana',
  month: 'Este mes',
  overdue: 'Vencidas',
  noDate: 'Sin fecha'
};

export const PRIORITY_LABELS: Record<PriorityFilter, string> = {
  all: 'Todas',
  do: 'do',
  decide: 'decide',
  delegate: 'delegate',
  delete: 'delete'
};

export const SIZE_LABELS: Record<SizeFilter, string> = {
  all: 'Todas',
  none: 'Sin tamaño',
  'pequeña': 'pequeña',
  'mediana': 'mediana',
  'grande': 'grande'
};

export const BOOLEAN_LABELS: Record<BooleanFilter, string> = {
  all: 'Todas',
  yes: 'Sí',
  no: 'No'
};

export const TIME_LABELS: Record<TimeFilter, string> = {
  all: 'Todas',
  t60: '≤1h',
  t120: '≤2h',
  t180: '≤3h',
  none: 'Sin estimación'
};

export const SORT_LABELS: Record<SortBy, string> = {
  default: 'Predeterminado',
  priorityAsc: 'Prioridad ↓',
  priorityDesc: 'Prioridad ↑',
  durationAsc: 'Duración ↓',
  durationDesc: 'Duración ↑'
};

export const useTaskFilters = (tasks: Task[]) => {
  const [selectedCategory, setSelectedCategory] = useState<Task['category'] | 'all'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('today');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('all');
  const [selectedSize, setSelectedSize] = useState<SizeFilter>('all');
  const [selectedUrgent, setSelectedUrgent] = useState<BooleanFilter>('all');
  const [selectedImportant, setSelectedImportant] = useState<BooleanFilter>('all');
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

    if (selectedTime !== 'all') {
      if (selectedTime === 'none') {
        filtered = filtered.filter(t => t.estimatedTime === undefined);
      } else {
        const limits: Record<TimeFilter, number> = { t60: 60, t120: 120, t180: 180, all: Infinity, none: 0 };
        const limit = limits[selectedTime];
        filtered = filtered.filter(t => (t.estimatedTime ?? Infinity) <= limit);
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
        filtered = filtered.filter(task =>
          task.startDate && isWithinInterval(task.startDate, { start: today, end: endOfDay(now) })
        );
        break;
      case 'tomorrow':
        filtered = filtered.filter(task =>
          task.startDate && isWithinInterval(task.startDate, { start: tomorrowStart, end: tomorrowEnd })
        );
        break;
      case 'week':
        filtered = filtered.filter(task =>
          task.startDate && isWithinInterval(task.startDate, { start: weekStart, end: weekEnd })
        );
        break;
      case 'month':
        filtered = filtered.filter(task =>
          task.startDate && isWithinInterval(task.startDate, { start: monthStart, end: monthEnd })
        );
        break;
      case 'overdue':
        filtered = filtered.filter(task =>
          task.startDate && isBefore(task.startDate, today)
        );
        break;
      case 'noDate':
        filtered = filtered.filter(task => !task.startDate);
        break;
      case 'all':
      default:
        break;
    }

    // Aplicar ordenamiento
    if (sortBy !== 'default') {
      filtered = [...filtered].sort((a, b) => {
        const priorityOrder = { do: 0, decide: 1, delegate: 2, delete: 3 };
        switch (sortBy) {
          case 'priorityAsc':
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          case 'priorityDesc':
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          case 'durationAsc':
            return (a.estimatedTime || Infinity) - (b.estimatedTime || Infinity);
          case 'durationDesc':
            return (b.estimatedTime || Infinity) - (a.estimatedTime || Infinity);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [
    tasks,
    selectedCategory,
    selectedDateFilter,
    selectedPriority,
    selectedSize,
    selectedUrgent,
    selectedImportant,
    selectedTime,
    sortBy,
    searchQuery
  ]);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedDateFilter !== 'today' ||
    selectedPriority !== 'all' ||
    selectedSize !== 'all' ||
    selectedUrgent !== 'all' ||
    selectedImportant !== 'all' ||
    selectedTime !== 'all' ||
    sortBy !== 'default' ||
    searchQuery !== '';

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedDateFilter('today');
    setSelectedPriority('all');
    setSelectedSize('all');
    setSelectedUrgent('all');
    setSelectedImportant('all');
    setSelectedTime('all');
    setSortBy('default');
    setSearchQuery('');
  };

  return {
    // State
    selectedCategory,
    selectedDateFilter,
    selectedPriority,
    selectedSize,
    selectedUrgent,
    selectedImportant,
    selectedTime,
    sortBy,
    searchQuery,

    // Setters
    setSelectedCategory,
    setSelectedDateFilter,
    setSelectedPriority,
    setSelectedSize,
    setSelectedUrgent,
    setSelectedImportant,
    setSelectedTime,
    setSortBy,
    setSearchQuery,

    // Computed
    filteredTasks,
    hasActiveFilters,
    clearAllFilters
  };
};
