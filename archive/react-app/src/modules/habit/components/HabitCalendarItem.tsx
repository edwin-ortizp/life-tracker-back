// src/modules/habit/components/HabitCalendarItem.tsx
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, RotateCcw, GripVertical } from 'lucide-react';
import { Habit, HABIT_COLORS } from '../models';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { cn } from '@/lib/utils';

interface HabitCalendarItemProps {
  habit: Habit;
  customTime?: string;
  onTimeChange: (habitId: number, newTime: string) => void;
  onComplete: (habitId: number) => void;
  onReset?: (habitId: number) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const HabitCalendarItem: React.FC<HabitCalendarItemProps> = ({
  habit,
  customTime,
  onComplete,
  onReset,
  style,
  className,
}) => {
  const [open, setOpen] = useState(false);

  // Setup draggable
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `habit-${habit.id}`,
    data: {
      habit,
      type: 'habit-move',
      currentTime: customTime || habit.baseTime,
    },
    disabled: open, // Deshabilitar drag cuando el popover está abierto
  });

  const habitColor = HABIT_COLORS[habit.id] || 'bg-purple-500';

  // Convertir clase Tailwind a color hex
  const getBackgroundColor = (): string => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-yellow-500': '#eab308',
      'bg-orange-500': '#f97316',
      'bg-purple-500': '#a855f7',
      'bg-pink-500': '#ec4899',
      'bg-red-500': '#ef4444',
      'bg-teal-500': '#14b8a6',
      'bg-indigo-500': '#6366f1',
      'bg-gray-500': '#6b7280',
      'bg-lime-500': '#84cc16',
      'bg-amber-500': '#f59e0b',
      'bg-cyan-500': '#06b6d4',
      'bg-fuchsia-500': '#d946ef',
      'bg-rose-500': '#f43f5e',
      'bg-violet-500': '#8b5cf6',
      'bg-sky-500': '#0ea5e9',
      'bg-emerald-500': '#10b981',
      'bg-yellow-600': '#ca8a04',
      'bg-pink-600': '#db2777',
      'bg-blue-600': '#2563eb',
      'bg-green-600': '#16a34a',
    };
    return colorMap[habitColor] || '#a855f7';
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onComplete(habit.id);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (onReset) {
      onReset(habit.id);
    }
  };

  // Calcular el estilo de transformación para el drag
  const dragStyle = transform
    ? {
        transform: CSS.Transform.toString(transform),
        zIndex: 1000,
      }
    : {};

  const isCustomTime = customTime && customTime !== habit.baseTime;

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
            backgroundColor: getBackgroundColor(),
            minHeight: '25px', // Altura fija: 15 minutos visuales (la mitad de una tarea)
          }}
        >
          {/* Drag Handle - Zona visible para arrastrar */}
          <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className="w-6 flex-shrink-0 bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-move border-r border-white/20 transition-colors"
            title="Arrastrar para mover hábito"
          >
            <GripVertical className="w-4 h-4 opacity-75" />
          </div>

          {/* Contenido del hábito */}
          <div className="flex-1 px-2 flex items-center min-w-0">
            {/* Icono y nombre (sin duración para ahorrar espacio) */}
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-base leading-none flex-shrink-0">{habit.icon}</span>
              <span className="font-medium text-xs leading-none truncate flex-1">
                {habit.name}
              </span>
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-2xl">{habit.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{habit.name}</h4>
                <div className="text-xs text-muted-foreground">
                  Duración: {habit.goal}
                </div>
              </div>
            </div>
          </div>

          {/* Tiempo */}
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Hora:</span>
              <span className="font-medium">{customTime || habit.baseTime}</span>
            </div>
            {isCustomTime && (
              <div className="text-[10px] text-amber-600 flex items-center gap-1">
                <span>⏰</span>
                <span>Hora personalizada (base: {habit.baseTime})</span>
              </div>
            )}
          </div>

          {/* Pasos (si existen) */}
          {habit.steps && habit.steps.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Pasos:</div>
              <ul className="text-xs space-y-1 pl-4">
                {habit.steps.map((step, index) => (
                  <li key={index} className="list-disc text-gray-600">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t">
            {/* Completar */}
            <Button
              variant="default"
              size="sm"
              className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
              onClick={handleComplete}
              title="Marcar como completado"
            >
              <Check className="w-3 h-3 mr-1" />
              Completar
            </Button>

            {/* Reset hora */}
            {isCustomTime && onReset && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={handleReset}
                title="Volver a hora base"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Restablecer hora ({habit.baseTime})
              </Button>
            )}
          </div>

          {/* Info adicional */}
          <div className="text-[10px] text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <span>💡</span>
              <span>Arrastra desde el borde izquierdo para cambiar la hora</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
