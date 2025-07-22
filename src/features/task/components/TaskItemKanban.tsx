import React, { memo, useCallback } from 'react';
import { isBefore, startOfDay, format, addDays } from 'date-fns';
import { toNoon } from '@/utils/dates';
import { X, Repeat, Calendar, Edit, Tag, Clock, Play } from 'lucide-react';
import { Task, TimeOfDay, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getCheckboxStats } from '@/utils/markdown';
import { useNavigate } from 'react-router-dom';
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

// Constants
const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
} as const;

const PRIORITY_CONFIG = {
  do: { label: 'HACER', color: 'bg-red-500', text: 'Urgente e importante' },
  decide: { label: 'DECIDIR', color: 'bg-orange-500', text: 'Importante, no urgente' },
  delegate: { label: 'DELEGAR', color: 'bg-blue-500', text: 'Urgente, no importante' },
  delete: { label: 'ELIMINAR', color: 'bg-gray-500', text: 'Ni urgente ni importante' },
  none: { label: '', color: '', text: '' }
} as const;

const PRIORITY_BADGES = {
  do: { icon: '🔥', num: 1, style: 'bg-red-600 text-white' },
  decide: { icon: '🤔', num: 2, style: 'bg-orange-500 text-white' },
  delegate: { icon: '📬', num: 3, style: 'bg-blue-500 text-white' },
  delete: { icon: '🗑️', num: 4, style: 'bg-gray-500 text-white' },
  none: { icon: '🗑️', num: 4, style: 'bg-gray-500 text-white' }
} as const;

// Types
type Priority = keyof typeof PRIORITY_CONFIG;
type RecurrenceType = keyof typeof RECURRENCE_LABELS;

interface TaskItemKanbanProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  onAssignTimeOfDay?: (taskId: string, timeOfDay: TimeOfDay) => void;
  showCategoryLabel?: boolean;
}

// Utility functions
const formatDateToSpanish = (date: Date): string => format(date, 'dd/MM');

const getRecurrenceDescription = (recurrence: any): string => {
  if (!recurrence?.type) return '';
  return RECURRENCE_LABELS[recurrence.type as RecurrenceType] || '';
};

const getPriorityInfo = (priority: string = 'none') => {
  return PRIORITY_CONFIG[priority as Priority] || PRIORITY_CONFIG.none;
};

const isTaskOverdue = (dueDate: Date | null): boolean => {
  return dueDate ? isBefore(startOfDay(dueDate), startOfDay(new Date())) : false;
};

// Badge component for kanban view
const TaskBadges = memo<{
  task: Task;
  showCategoryLabel: boolean;
  overdue: boolean;
}>(({ task, showCategoryLabel, overdue }) => {
  const categoryStyle = {
    bg: CATEGORY_COLORS[task.category as keyof typeof CATEGORY_COLORS]?.bg || 'bg-purple-100',
    text: CATEGORY_COLORS[task.category as keyof typeof CATEGORY_COLORS]?.text || 'text-purple-800'
  };

  const pInfo = getPriorityInfo(task.priority);
  const recurrenceDescription = getRecurrenceDescription(task.recurrence);
  const badgeSize = 'text-xs px-1.5 py-0.5';

  return (
    <div className="flex flex-wrap gap-1">
      {/* Category Badge */}
      {showCategoryLabel && (
        <Badge className={cn(badgeSize, categoryStyle.bg, categoryStyle.text)}>
          <Tag className="w-3 h-3 mr-1" />
          {CATEGORY_LABELS[task.category]}
        </Badge>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <Badge variant={overdue ? "destructive" : "secondary"} className={badgeSize}>
          <Calendar className="w-3 h-3 mr-1" />
          {formatDateToSpanish(task.dueDate)}
          {overdue && " (vencida)"}
        </Badge>
      )}

      {/* Priority badge for kanban */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={cn(
                badgeSize,
                'gap-0.5',
                PRIORITY_BADGES[(task.priority || 'none') as keyof typeof PRIORITY_BADGES].style
              )}
            >
              <span className="mr-0.5">
                {PRIORITY_BADGES[(task.priority || 'none') as keyof typeof PRIORITY_BADGES].icon}
              </span>
              {PRIORITY_BADGES[(task.priority || 'none') as keyof typeof PRIORITY_BADGES].num}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{pInfo.text}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Estimated time */}
      {task.estimatedTime !== undefined && (
        <Badge variant="outline" className={badgeSize}>
          <Clock className="w-3 h-3 mr-1" />
          {task.estimatedTime}m
        </Badge>
      )}

      {/* Recurrence */}
      {task.isRecurrent && recurrenceDescription && (
        <Badge variant="outline" className={badgeSize}>
          <Repeat className="w-3 h-3 mr-1" />
          {recurrenceDescription}
        </Badge>
      )}
    </div>
  );
});

TaskBadges.displayName = 'TaskBadges';

// Kanban-specific TaskActions
const TaskKanbanActions = memo<{
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  onAssignTimeOfDay?: (taskId: string, timeOfDay: TimeOfDay) => void;
}>(({ task, onEdit, onDelete, onMove, onAssignTimeOfDay }) => {
  const navigate = useNavigate();
  
  const handleSetToday = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, toNoon(new Date()));
  }, [onMove, task.id]);

  const handleSetTomorrow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, toNoon(addDays(new Date(), 1)));
  }, [onMove, task.id]);

  const handleSetDayAfterTomorrow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, toNoon(addDays(new Date(), 2)));
  }, [onMove, task.id]);

  const handleRemoveDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, null);
  }, [onMove, task.id]);

  const handleAssignMorning = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAssignTimeOfDay?.(task.id, 'morning');
  }, [onAssignTimeOfDay, task.id]);

  const handleAssignAfternoon = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAssignTimeOfDay?.(task.id, 'afternoon');
  }, [onAssignTimeOfDay, task.id]);

  const handleAssignEvening = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAssignTimeOfDay?.(task.id, 'evening');
  }, [onAssignTimeOfDay, task.id]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  }, [onEdit, task]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);

  const handleRun = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/task/${task.taskCode}/run`);
  }, [navigate, task.taskCode]);

  const buttonClassName = "h-6 w-6 md:h-5 md:w-5 p-0 rounded-full hover:bg-muted";

  const quickActions = onMove && (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Asignar para hoy"
        onClick={handleSetToday}
      >
        <span role="img" aria-label="hoy" className="text-xs">📅</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Asignar para mañana"
        onClick={handleSetTomorrow}
      >
        <span role="img" aria-label="mañana" className="text-xs">🌅</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Asignar para pasado mañana"
        onClick={handleSetDayAfterTomorrow}
      >
        <span role="img" aria-label="pasado mañana" className="text-xs">🚀</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Quitar fecha"
        onClick={handleRemoveDate}
      >
        <span role="img" aria-label="sin fecha" className="text-xs">❌</span>
      </Button>
    </div>
  );

  const timeActions = onAssignTimeOfDay && (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Asignar a mañana"
        onClick={handleAssignMorning}
      >
        <span role="img" aria-label="mañana" className="text-xs">🌅</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Asignar a tarde"
        onClick={handleAssignAfternoon}
      >
        <span role="img" aria-label="tarde" className="text-xs">🏙️</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Asignar a noche"
        onClick={handleAssignEvening}
      >
        <span role="img" aria-label="noche" className="text-xs">🌙</span>
      </Button>
    </div>
  );

  return (
    <div className="flex justify-between w-full">
      <div className="flex gap-1">
        {quickActions}
        {timeActions}
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={buttonClassName}
          title="Ejecutar"
          onClick={handleRun}
        >
          <Play className="w-3 h-3 md:w-3 md:h-3 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClassName}
          title="Editar tarea"
          onClick={handleEdit}
        >
          <Edit className="w-3 h-3 md:w-3 md:h-3 text-muted-foreground" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(buttonClassName, 'hover:bg-red-50')}
              title="Eliminar tarea"
              onClick={(e) => e.stopPropagation()}
            >
              <X className="w-3 h-3 md:w-3 md:h-3 text-red-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La tarea "{task.title}" será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});

TaskKanbanActions.displayName = 'TaskKanbanActions';

// Main component
export const TaskItemKanban = memo<TaskItemKanbanProps>(({
  task,
  onDelete,
  onEdit,
  onView,
  onMove,
  onAssignTimeOfDay,
  showCategoryLabel = true
}) => {
  const overdue = isTaskOverdue(task.dueDate ?? null);
  const { total, checked } = getCheckboxStats(task.description || '');
  const checkboxProgress = total ? (task.progress ?? (checked / total) * 100) : 0;

  const handleCardClick = useCallback(() => {
    onView?.(task);
  }, [onView, task]);

  const cardClassName = cn(
    'cursor-pointer relative hover:shadow-md transition-all duration-200 border-0 shadow-sm text-sm w-full max-w-none lg:max-w-[18rem]',
    task.completed ? 'bg-muted/30' : 'bg-white',
    !task.completed && overdue && 'border-l-4 border-l-red-500 bg-red-50'
  );

  return (
    <Card onClick={handleCardClick} className={cardClassName}>
      <CardContent className="p-2 md:p-2 flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              {task.isPrivate && <span className="text-xs">🔒</span>}
              <span className={cn(
                'text-sm break-words line-clamp-2 font-medium flex-1',
                task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
              )}>
                {task.title}
              </span>
              <span className="text-xs font-mono text-gray-400 flex-shrink-0">#{task.taskCode}</span>
            </div>
            
            {task.description && (
              <p className={cn(
                'text-xs text-muted-foreground line-clamp-2 break-words leading-relaxed',
                task.completed && 'line-through'
              )}>
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1 pt-0.5">
              <TaskBadges
                task={task}
                showCategoryLabel={showCategoryLabel}
                overdue={overdue}
              />
            </div>
            {total > 0 && (
              <div className="pt-1 space-y-0.5">
                <Progress value={checkboxProgress} className="h-1" />
                <p className="text-[10px] text-right text-muted-foreground">
                  {checked} de {total}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-2 py-1.5 bg-gray-50/50 border-t border-gray-100 p-0 md:p-0">
        <div className="px-2 py-1.5 w-full">
          <TaskKanbanActions
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
            onAssignTimeOfDay={onAssignTimeOfDay}
          />
        </div>
      </CardFooter>
    </Card>
  );
});

TaskItemKanban.displayName = 'TaskItemKanban';