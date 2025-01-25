import React from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { CheckCircle2, Circle, X, Repeat, AlignLeft, Calendar, Edit, Tag } from 'lucide-react';
import { Task, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { formatDateToSpanish, getRecurrenceText } from '@/utils/dates';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const overdue = task.dueDate && isBefore(startOfDay(task.dueDate), startOfDay(new Date()));
  const categoryStyle = CATEGORY_COLORS[task.category];

  // Obtener el texto de recurrencia usando la utilidad centralizada
  const recurrenceDescription = task.isRecurrent && task.recurrence ? 
    getRecurrenceText(
      task.dueDate || new Date(),
      task.recurrence.pattern,
      task.recurrence.customDays
    ) : '';

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
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${categoryStyle.bg} ${categoryStyle.text}`}>
              <Tag className="w-3 h-3" />
              {CATEGORY_LABELS[task.category]}
            </span>

            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded
                ${overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                <Calendar className="w-3 h-3" />
                {formatDateToSpanish(task.dueDate)}
                {overdue && ' (vencida)'}
              </span>
            )}
            
            {task.isRecurrent && task.recurrence && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                <Repeat className="w-3 h-3" />
                {recurrenceDescription}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 hover:bg-gray-100 rounded-full"
            title="Editar tarea"
          >
            <Edit className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 hover:bg-gray-100 rounded-full"
            title="Eliminar tarea"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};