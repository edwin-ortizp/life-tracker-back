import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Edit, Clock } from 'lucide-react';
import { Task, CATEGORY_COLORS, CATEGORY_LABELS } from '../types';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TaskCalendarCompactProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const TaskCalendarCompact: React.FC<TaskCalendarCompactProps> = ({
  task,
  onDelete,
  onEdit,
  style,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const categoryColors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.personal;

  // Determinar color de borde basado en categoría
  const getBorderColor = () => {
    const colorMap: Record<string, string> = {
      'text-red-700': '#b91c1c',
      'text-blue-700': '#1d4ed8',
      'text-green-700': '#15803d',
      'text-purple-700': '#7e22ce',
      'text-orange-700': '#c2410c',
      'text-pink-700': '#be185d',
    };
    return colorMap[categoryColors.text] || '#7e22ce';
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onEdit(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onDelete(task.id);
  };

  // Formatear hora de inicio
  const startTime = task.startDate ? format(task.startDate, 'HH:mm') : '';
  const endTime = task.endDate ? format(task.endDate, 'HH:mm') : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'cursor-pointer overflow-hidden rounded text-white text-xs p-1',
            'hover:opacity-90 transition-opacity',
            'flex flex-col',
            className
          )}
          style={{
            ...style,
            backgroundColor: getBorderColor(),
            minHeight: '48px', // Mínimo para que sea clickeable
          }}
        >
          <div className="font-semibold leading-tight truncate">
            {task.title}
          </div>
          <div className="text-[10px] opacity-90 leading-tight mt-0.5">
            {startTime}{endTime && ` - ${endTime}`}
          </div>
          {task.isPrivate && (
            <div className="text-[10px] opacity-75">🔒</div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm flex-1">{task.title}</h4>
              {task.isPrivate && <span className="text-sm">🔒</span>}
            </div>
            <div className="text-xs text-muted-foreground">#{task.taskCode}</div>
          </div>

          {/* Time and Category */}
          <div className="space-y-2 text-xs">
            {task.startDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>
                  {format(task.startDate, 'dd/MM/yyyy')} - {startTime}
                  {endTime && ` a ${endTime}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getBorderColor() }}
              />
              <span>{CATEGORY_LABELS[task.category]}</span>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
              {task.description.slice(0, 200)}
              {task.description.length > 200 && '...'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleEdit}
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              onClick={handleDelete}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
