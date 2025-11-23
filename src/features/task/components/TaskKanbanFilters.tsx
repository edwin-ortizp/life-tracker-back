// src/features/task/components/TaskKanbanFilters.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';
import { TASK_CATEGORIES, CATEGORY_LABELS, Task } from '../types';
import {
  DateFilter,
  PriorityFilter,
  SizeFilter,
  BooleanFilter,
  TimeFilter,
  SortBy,
  DATE_FILTER_LABELS,
  PRIORITY_LABELS,
  SIZE_LABELS,
  BOOLEAN_LABELS,
  TIME_LABELS,
  SORT_LABELS
} from '../hooks/useTaskFilters';

interface TaskKanbanFiltersProps {
  selectedCategory: Task['category'] | 'all';
  selectedDateFilter: DateFilter;
  selectedPriority: PriorityFilter;
  selectedSize: SizeFilter;
  selectedUrgent: BooleanFilter;
  selectedImportant: BooleanFilter;
  selectedTime: TimeFilter;
  sortBy: SortBy;
  searchQuery: string;
  hasActiveFilters: boolean;
  showFilters: boolean;

  onCategoryChange: (value: Task['category'] | 'all') => void;
  onDateFilterChange: (value: DateFilter) => void;
  onPriorityChange: (value: PriorityFilter) => void;
  onSizeChange: (value: SizeFilter) => void;
  onUrgentChange: (value: BooleanFilter) => void;
  onImportantChange: (value: BooleanFilter) => void;
  onTimeChange: (value: TimeFilter) => void;
  onSortByChange: (value: SortBy) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

export const TaskKanbanFilters: React.FC<TaskKanbanFiltersProps> = ({
  selectedCategory,
  selectedDateFilter,
  selectedPriority,
  selectedSize,
  selectedUrgent,
  selectedImportant,
  selectedTime,
  sortBy,
  searchQuery,
  hasActiveFilters,
  showFilters,
  onCategoryChange,
  onDateFilterChange,
  onPriorityChange,
  onSizeChange,
  onUrgentChange,
  onImportantChange,
  onTimeChange,
  onSortByChange,
  onSearchQueryChange,
  onToggleFilters,
  onClearFilters
}) => {
  return (
    <>
      {/* Buscador y botón de filtros */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar tareas por nombre..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Botón de filtros para móvil */}
        <div className="md:hidden flex gap-2">
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            onClick={onToggleFilters}
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
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {TASK_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDateFilter} onValueChange={onDateFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_FILTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={onPriorityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSize} onValueChange={onSizeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tamaño" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SIZE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedUrgent} onValueChange={onUrgentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Urgente" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BOOLEAN_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  Urgente: {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedImportant} onValueChange={onImportantChange}>
            <SelectTrigger>
              <SelectValue placeholder="Importante" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BOOLEAN_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  Importante: {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTime} onValueChange={onTimeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tiempo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botón para limpiar filtros en escritorio */}
        {hasActiveFilters && (
          <div className="hidden md:flex justify-end mt-2">
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
