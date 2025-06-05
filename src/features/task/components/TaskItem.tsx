import React from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { CheckCircle2, Circle, X, Repeat, AlignLeft, Calendar, Edit, Tag } from 'lucide-react';
import { Task, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { formatDateToSpanish, getRecurrenceText } from '@/utils/dates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit, onView }) => {
  const overdue = task.dueDate && isBefore(startOfDay(task.dueDate), startOfDay(new Date()));
  const categoryStyle = CATEGORY_COLORS[task.category];

  const priorityInfo: Record<string, { color: string; text: string }> = {
    do: { color: 'bg-red-500', text: 'Hacer (urgente + importante)' },
    decide: { color: 'bg-orange-500', text: 'Decidir (importante)' },
    delegate: { color: 'bg-blue-500', text: 'Delegar (urgente)' },
    delete: { color: 'bg-gray-400', text: 'Eliminar (sin prioridad)' },
    none: { color: 'bg-gray-400', text: 'Eliminar (sin prioridad)' }
  };
  const pInfo = priorityInfo[task.priority || 'none'];

  // Obtener el texto de recurrencia usando la utilidad centralizada
  const recurrenceDescription = task.isRecurrent && task.recurrence ? 
    getRecurrenceText(
      task.dueDate || new Date(),
      task.recurrence.pattern,
      task.recurrence.customDays
    ) : '';

  return (
    <Card
      onClick={() => onView && onView(task)}
      className={cn(
        'cursor-pointer relative',
        task.completed ? 'bg-muted/50' : overdue ? 'border-destructive bg-destructive/5' : ''
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('absolute top-1 right-1 w-3 h-3 rounded-full', pInfo.color)} />
          </TooltipTrigger>
          <TooltipContent>{pInfo.text}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CardContent className="p-2 flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-1 mt-0.5 rounded-full"
            onClick={(e) => { e.stopPropagation(); onToggle(task.id, !task.completed); }}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("break-all", task.completed ? 'line-through text-muted-foreground' : 'font-medium')}>
                {task.title}
              </span>
              {task.description && (
                // TooltipProvider and related components removed for now to stick to original scope
                <AlignLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </div>
            
            {/* Display full description if no title, or as a separate paragraph if title exists and it's desired.
                For now, only showing description if title is missing, or via AlignLeft icon hint.
                The original showed it as a line-clamped paragraph if present. Let's restore that for consistency
                if title is present.
            */}
            {task.description && task.title && (
              <p className={cn("text-sm text-muted-foreground mt-1 line-clamp-2 break-all", task.completed && "line-through")}>
                {task.description}
              </p>
            )}
            {task.description && !task.title && (
              <p className={cn("text-sm text-muted-foreground mt-1 line-clamp-2 break-all", task.completed && "line-through")}>
                {task.description}
              </p>
            )}
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-1 rounded-full"
              title="Editar tarea"
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            >
              <Edit className="w-4 h-4 text-muted-foreground" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-1 rounded-full"
                  title="Eliminar tarea"
                  onClick={(e) => e.stopPropagation()}
                >
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(task.id)}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center pl-8">
          <span className={cn(
            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-md",
            categoryStyle.bg,
            categoryStyle.text
          )}>
            <Tag className="w-3 h-3" />
            {CATEGORY_LABELS[task.category]}
          </span>

          {task.dueDate && (
            overdue ? (
              <Badge variant="destructive" className="text-xs font-normal px-2 py-0.5">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDateToSpanish(task.dueDate)} (vencida)
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDateToSpanish(task.dueDate)}
              </Badge>
            )
          )}

          {task.isRecurrent && task.recurrence && (
            <Badge variant="outline" className="text-xs font-normal px-2 py-0.5 text-accent-foreground border-accent">
              <Repeat className="w-3 h-3 mr-1" />
              {recurrenceDescription}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
