import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { X, Edit, Clock, GripVertical, Timer, Play, Check, Calendar } from 'lucide-react';
import { useGoogleCalendarExport } from '../controllers/useGoogleCalendarExport';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Task, CATEGORY_COLORS, CATEGORY_LABELS } from '../models';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { cn } from '@/lib/utils';

interface TaskCalendarCompactProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onQuickUpdate?: (task: Task) => void;
  onToggle?: (taskId: string, completed: boolean) => void;
  style?: React.CSSProperties;
  className?: string;
  isDraggable?: boolean;
}

export const TaskCalendarCompact: React.FC<TaskCalendarCompactProps> = ({
  task,
  onDelete,
  onEdit,
  onQuickUpdate,
  onToggle,
  style,
  className,
  isDraggable = true,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { exportTaskToGoogleCalendar } = useGoogleCalendarExport();

  // Setup draggable
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: {
      task,
      type: 'task-move',
    },
    disabled: !isDraggable || open, // Deshabilitar drag cuando el popover está abierto
  });

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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (onToggle) {
      onToggle(task.id, !task.completed);
    }
  };

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    navigate(`/task/${task.id}/run`);
  };

  const handleExportToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    exportTaskToGoogleCalendar(task);
  };

  // Formatear hora de inicio
  const startTime = task.startDate ? format(task.startDate, 'HH:mm') : '';
  const endTime = task.endDate ? format(task.endDate, 'HH:mm') : '';

  // Calcular duración actual
  const durationInfo = useMemo(() => {
    if (!task.startDate || !task.endDate) return null;

    const durationMs = task.endDate.getTime() - task.startDate.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    if (durationMinutes < 60) {
      return { minutes: durationMinutes, label: `${durationMinutes} min` };
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      return {
        minutes: durationMinutes,
        label: mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
      };
    }
  }, [task.startDate, task.endDate]);

  // Función para ajustar duración
  const handleDurationAdjust = (minutesToAdd: number) => {
    if (!task.endDate || !task.startDate) return;

    const newEndDate = new Date(task.endDate);
    newEndDate.setMinutes(newEndDate.getMinutes() + minutesToAdd);

    // Validar duración mínima (15 minutos)
    const newDuration = newEndDate.getTime() - task.startDate.getTime();
    if (newDuration < 15 * 60000) return;

    // Validar que no pase de 22:00
    if (newEndDate.getHours() > 22 || (newEndDate.getHours() === 22 && newEndDate.getMinutes() > 0)) {
      return;
    }

    // Cerrar popover
    setOpen(false);

    // Usar onQuickUpdate si está disponible (actualización directa sin modal)
    // De lo contrario, usar onEdit (abre modal)
    if (onQuickUpdate) {
      onQuickUpdate({ ...task, endDate: newEndDate });
    } else {
      onEdit({ ...task, endDate: newEndDate });
    }
  };

  // Verificar si los botones de ajuste están habilitados
  const canDecreaseDuration = useMemo(() => {
    if (!durationInfo) return { by30: false, by60: false };
    return {
      by30: durationInfo.minutes >= 45,  // Mínimo 15 min después de restar 30
      by60: durationInfo.minutes >= 75   // Mínimo 15 min después de restar 60
    };
  }, [durationInfo]);

  const canIncreaseDuration = useMemo(() => {
    if (!task.endDate) return { by30: false, by60: false, by120: false };

    const check = (minutesToAdd: number) => {
      const testDate = new Date(task.endDate!);
      testDate.setMinutes(testDate.getMinutes() + minutesToAdd);
      return testDate.getHours() < 22 || (testDate.getHours() === 22 && testDate.getMinutes() === 0);
    };

    return {
      by30: check(30),
      by60: check(60),
      by120: check(120)
    };
  }, [task.endDate]);

  // Calcular el estilo de transformación para el drag
  const dragStyle = transform
    ? {
        transform: CSS.Transform.toString(transform),
        zIndex: 1000,
      }
    : {};

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'cursor-pointer overflow-hidden rounded text-white text-xs relative',
            'hover:opacity-90 transition-opacity',
            'flex',
            isDragging && 'opacity-50 shadow-lg',
            className
          )}
          style={{
            ...style,
            ...dragStyle,
            backgroundColor: getBorderColor(),
            minHeight: '48px', // Mínimo para que sea clickeable
          }}
        >
          {/* Drag Handle - Zona visible para arrastrar */}
          {isDraggable && (
            <div
              ref={setNodeRef}
              {...attributes}
              {...listeners}
              className="w-6 flex-shrink-0 bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-move border-r border-white/20 transition-colors"
              title="Arrastrar para mover tarea"
            >
              <GripVertical className="w-4 h-4 opacity-75" />
            </div>
          )}

          {/* Contenido de la tarea */}
          <div className="flex-1 p-1 flex flex-col min-w-0">
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

          {/* Duration Adjustment - Solo si hay startDate y endDate */}
          {durationInfo && (
            <div className="space-y-2 p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Timer className="w-3 h-3" />
                <span>Duración: {durationInfo.label}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleDurationAdjust(-60)}
                  disabled={!canDecreaseDuration.by60}
                  title={!canDecreaseDuration.by60 ? "Duración mínima: 15 min" : "Reducir 1 hora"}
                >
                  -1h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleDurationAdjust(-30)}
                  disabled={!canDecreaseDuration.by30}
                  title={!canDecreaseDuration.by30 ? "Duración mínima: 15 min" : "Reducir 30 minutos"}
                >
                  -30
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleDurationAdjust(30)}
                  disabled={!canIncreaseDuration.by30}
                  title={!canIncreaseDuration.by30 ? "Límite: 22:00" : "Aumentar 30 minutos"}
                >
                  +30
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleDurationAdjust(60)}
                  disabled={!canIncreaseDuration.by60}
                  title={!canIncreaseDuration.by60 ? "Límite: 22:00" : "Aumentar 1 hora"}
                >
                  +1h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleDurationAdjust(120)}
                  disabled={!canIncreaseDuration.by120}
                  title={!canIncreaseDuration.by120 ? "Límite: 22:00" : "Aumentar 2 horas"}
                >
                  +2h
                </Button>
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
              {task.description.slice(0, 200)}
              {task.description.length > 200 && '...'}
            </div>
          )}

          {/* Exportar a Google Calendar */}
          {!task.isPrivate && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 h-8 text-xs"
              onClick={handleExportToCalendar}
            >
              <Calendar className="w-3 h-3" />
              Exportar a Google Calendar
            </Button>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t">
            {/* Primera fila: Completar y Ejecutar */}
            <div className="flex gap-2">
              {onToggle && (
                <Button
                  variant={task.completed ? "outline" : "default"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={handleToggle}
                  title={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
                >
                  {task.completed ? (
                    <>
                      <span className="mr-1">↩️</span>
                      Pendiente
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Completar
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleRun}
                title="Ejecutar tarea con timer"
              >
                <Play className="w-3 h-3 mr-1 text-green-600" />
                Ejecutar
              </Button>
            </div>

            {/* Segunda fila: Editar y Eliminar */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleEdit}
                title="Editar tarea"
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs px-3"
                onClick={handleDelete}
                title="Eliminar tarea"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
