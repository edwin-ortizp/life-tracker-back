// src/features/task/components/TaskList.tsx
import React, { useState } from 'react';
import { CheckCircle2, Circle, X, Repeat, AlignLeft, Calendar, Edit, Tag } from 'lucide-react';
import { format, isBefore, startOfDay, addDays, addWeeks, addMonths, endOfDay, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task, TaskCategory, TASK_CATEGORIES } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  personal: 'Personal',
  work: 'Trabajo',
  home: 'Casa',
  health: 'Salud',
  shopping: 'Compras',
  study: 'Estudio',
  social: 'Social',
  other: 'Otro'
};

const CATEGORY_COLORS: Record<TaskCategory, { bg: string, text: string }> = {
  personal: { bg: 'bg-purple-100', text: 'text-purple-700' },
  work: { bg: 'bg-blue-100', text: 'text-blue-700' },
  home: { bg: 'bg-green-100', text: 'text-green-700' },
  health: { bg: 'bg-red-100', text: 'text-red-700' },
  shopping: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  study: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  social: { bg: 'bg-pink-100', text: 'text-pink-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' }
};

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

interface GroupedTasks {
  overdue: Task[];
  today: Task[];
  thisWeek: Task[];
  future: Task[];
  noDate: Task[];
}

const TaskItem: React.FC<{ 
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}> = ({ task, onToggle, onDelete, onEdit }) => {
  const overdue = task.dueDate && isBefore(startOfDay(task.dueDate), startOfDay(new Date()));
  const categoryStyle = CATEGORY_COLORS[task.category];

  const formatDate = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  const getRecurrenceText = (task: Task) => {
    if (!task.isRecurrent || !task.recurrence) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextDate;
    
    switch (task.recurrence.pattern) {
      case 'daily':
        return 'Diariamente';
      case 'weekly':
        nextDate = addWeeks(today, 1);
        return `Semanalmente (próximo ${format(nextDate, 'EEEE', { locale: es })})`;
      case 'monthly':
        nextDate = addMonths(today, 1);
        return `Mensualmente (próximo ${format(nextDate, "d 'de' MMMM", { locale: es })})`;
      case 'custom':
        nextDate = addDays(today, task.recurrence.customDays || 1);
        return `Cada ${task.recurrence.customDays} días (próximo ${format(nextDate, 'EEEE', { locale: es })})`;
      default:
        return '';
    }
  };

  return (
    <div 
      className={`flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-50 border
        ${overdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggle(task.id, task.completed)}
          className="p-1 hover:bg-gray-100 rounded-full mt-0.5"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={task.completed ? 'line-through text-gray-400' : 'font-medium'}>
              {task.title}
            </span>
            {task.description && (
              <AlignLeft className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-2 items-center">
            {/* Categoría */}
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${categoryStyle.bg} ${categoryStyle.text}`}>
              <Tag className="w-3 h-3" />
              {CATEGORY_LABELS[task.category]}
            </span>

            {/* Fecha */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded
                ${overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
                {overdue && ' (vencida)'}
              </span>
            )}
            
            {/* Recurrencia */}
            {task.isRecurrent && task.recurrence && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                <Repeat className="w-3 h-3" />
                {getRecurrenceText(task)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 hover:bg-gray-100 rounded-full"
          >
            <Edit className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // Helper para agrupar tareas por período
  const groupTasks = (tasks: Task[]): GroupedTasks => {
    const now = new Date();
    const today = startOfDay(now);
    const endToday = endOfDay(now);
    const endWeek = endOfDay(endOfWeek(now));

    return tasks.reduce((groups, task) => {
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
      overdue: [],
      today: [],
      thisWeek: [],
      future: [],
      noDate: []
    } as GroupedTasks);
  };

  // Ordenar tareas dentro de cada grupo
  const sortTasksInGroup = (tasks: Task[]): Task[] => {
    return tasks.sort((a, b) => {
      // Si ambas tienen fecha, ordenar por fecha
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      // Si no tienen fecha, ordenar por creación (más reciente primero)
      if (!a.dueDate && !b.dueDate) {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
      // Si solo una tiene fecha, la que tiene fecha va primero
      return a.dueDate ? -1 : 1;
    });
  };

  const TaskGroup: React.FC<{ title: string; tasks: Task[] }> = ({ title, tasks }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider pt-4">
          {title}
        </h3>
        {sortTasksInGroup(tasks).map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    );
  };

  const groupedTasks = groupTasks(filteredTasks);

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
        <TaskGroup title="Tareas Vencidas" tasks={groupedTasks.overdue} />
        <TaskGroup title="Para Hoy" tasks={groupedTasks.today} />
        <TaskGroup title="Esta Semana" tasks={groupedTasks.thisWeek} />
        <TaskGroup title="Próximamente" tasks={groupedTasks.future} />
        <TaskGroup title="Sin Fecha" tasks={groupedTasks.noDate} />

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