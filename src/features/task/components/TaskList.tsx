import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, TASK_CATEGORIES, CATEGORY_LABELS } from '../types';
import { TaskGroup } from './TaskGroup';
import { isBefore, startOfDay, endOfDay, endOfWeek } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // Filtrar tareas por categoría
  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

  // Agrupar tareas usando useMemo para optimizar rendimiento
  const groupedTasks = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const endWeek = endOfDay(endOfWeek(now));

    return filteredTasks.reduce((groups, task) => {
      // Primero verificamos si está vencida
      if (task.dueDate && isBefore(task.dueDate, today)) {
        groups.overdue.push(task);
      }
      // Si no tiene fecha, va al grupo noDate pero ordenado por creación
      else if (!task.dueDate) {
        groups.noDate.push(task);
      }
      // Si es para hoy
      else if (isBefore(task.dueDate, endToday)) {
        groups.today.push(task);
      }
      // Si es para esta semana
      else if (isBefore(task.dueDate, endWeek)) {
        groups.thisWeek.push(task);
      }
      // Si es para el futuro
      else {
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
      {/* Filtro de categorías */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 font-medium">Filtrar por:</span>
        <Select
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as TaskCategory | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(TASK_CATEGORIES).map(([value]) => (
              <SelectItem key={value} value={value}>
                {CATEGORY_LABELS[value as TaskCategory]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            {selectedCategory === 'all' 
              ? 'No hay tareas pendientes'
              : `No hay tareas pendientes en la categoría ${CATEGORY_LABELS[selectedCategory]}`
            }
          </div>
        )}
      </div>
    </div>
  );
};