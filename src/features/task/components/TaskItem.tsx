import React, { memo, useCallback, forwardRef } from 'react';
import { isBefore, startOfDay, format, addDays } from 'date-fns';
import { toNoon } from '@/utils/dates';
import { X, Repeat, Calendar, Edit, Tag, AlignLeft, Clock, Play } from 'lucide-react';
import { Task, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
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
const ICON_SIZES = {
  small: 'w-3 h-3',
  medium: 'w-3.5 h-3.5',
  large: 'w-5 h-5',
} as const;

const BUTTON_SIZES = {
  small: 'h-5 w-5',
  medium: 'h-6 w-6',
} as const;

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

interface TaskItemProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onView?: (task: Task) => void;
  onRun?: (task: Task) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  variant?: 'list' | 'kanban';
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

// Sub-components with forwardRef support

// Badge already supports forwardRef, so we can use it directly
const BadgeWithRef = Badge;

const TaskBadges = memo<{
  task: Task;
  showCategoryLabel: boolean;
  overdue: boolean;
  variant: 'list' | 'kanban';
}>(({ task, showCategoryLabel, overdue, variant }) => {
  const categoryStyle = {
    bg: CATEGORY_COLORS[task.category as keyof typeof CATEGORY_COLORS]?.bg || 'bg-purple-100',
    text: CATEGORY_COLORS[task.category as keyof typeof CATEGORY_COLORS]?.text || 'text-purple-800'
  };

  const pInfo = getPriorityInfo(task.priority);
  const recurrenceDescription = getRecurrenceDescription(task.recurrence);
  const badgeSize = variant === 'list' ? 'text-xs px-1 py-0.5 h-auto' : 'text-xs px-1.5 py-0.5';
  const iconSize = variant === 'list' ? ICON_SIZES.small : ICON_SIZES.small;

  return (
    <div className="flex flex-wrap gap-1">
      {/* Category Badge */}
      {showCategoryLabel && (
        <Badge className={cn(badgeSize, categoryStyle.bg, categoryStyle.text)}>
          <Tag className={cn(iconSize, 'mr-1')} />
          {CATEGORY_LABELS[task.category]}
        </Badge>
      )}

      {/* Priority label when category hidden in list view */}
      {variant === 'list' && !showCategoryLabel && pInfo.label && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <BadgeWithRef className={cn(badgeSize, 'text-white', pInfo.color)}>
                {pInfo.label}
              </BadgeWithRef>
            </TooltipTrigger>
            <TooltipContent>{pInfo.text}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Size when category is hidden */}
      {!showCategoryLabel && task.size && (
        <Badge variant="outline" className={badgeSize}>
          {task.size}
        </Badge>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <Badge variant={overdue ? "destructive" : "secondary"} className={badgeSize}>
          <Calendar className={cn(iconSize, 'mr-1')} />
          {formatDateToSpanish(task.dueDate)}
          {overdue && " (vencida)"}
        </Badge>
      )}

      {/* Priority badge for kanban */}
      {variant === 'kanban' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <BadgeWithRef
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
              </BadgeWithRef>
            </TooltipTrigger>
            <TooltipContent>{pInfo.text}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Estimated time */}
      {variant === 'kanban' && task.estimatedTime !== undefined && (
        <Badge variant="outline" className={badgeSize}>
          <Clock className={cn(iconSize, 'mr-1')} />
          {task.estimatedTime}m
        </Badge>
      )}

      {/* Recurrence */}
      {task.isRecurrent && recurrenceDescription && (
        <Badge variant="outline" className={badgeSize}>
          <Repeat className={cn(iconSize, 'mr-1')} />
          {recurrenceDescription}
        </Badge>
      )}

      {/* Priority for list view when not recurrent */}
      {variant === 'list' && !task.isRecurrent && pInfo.label && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <BadgeWithRef className={cn(badgeSize, 'text-white cursor-help', pInfo.color)}>
                {pInfo.label}
              </BadgeWithRef>
            </TooltipTrigger>
            <TooltipContent>{pInfo.text}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
});

TaskBadges.displayName = 'TaskBadges';

// Action button with forwardRef support
const ActionButton = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & { children: React.ReactNode }
>(({ children, ...props }, ref) => (
  <Button ref={ref} {...props}>
    {children}
  </Button>
));

ActionButton.displayName = 'ActionButton';

const TaskActions = memo<{
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove?: (taskId: string, dueDate: Date | null) => void;
  onRun?: (task: Task) => void;
  variant: 'list' | 'kanban';
}>(({ task, onEdit, onDelete, onMove, onRun, variant }) => {
  const handleSetToday = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, toNoon(new Date()));
  }, [onMove, task.id]);

  const handleSetTomorrow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, toNoon(addDays(new Date(), 1)));
  }, [onMove, task.id]);

  const handleRemoveDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(task.id, null);
  }, [onMove, task.id]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  }, [onEdit, task]);

  const handleRun = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRun?.(task);
  }, [onRun, task]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);

  const buttonClassName = cn(
    BUTTON_SIZES.medium,
    'md:h-5 md:w-5 p-0 rounded-full hover:bg-muted'
  );

  const quickActions = variant === 'kanban' && onMove && (
    <div className="flex gap-1">
      <ActionButton
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Asignar para hoy"
        onClick={handleSetToday}
      >
        <span role="img" aria-label="hoy" className="text-sm md:text-xs">📅</span>
      </ActionButton>
      <ActionButton
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Asignar para mañana"
        onClick={handleSetTomorrow}
      >
        <span role="img" aria-label="mañana" className="text-sm md:text-xs">🌅</span>
      </ActionButton>
      <ActionButton
        variant="ghost"
        size="icon"
        className={buttonClassName}
        title="Quitar fecha"
        onClick={handleRemoveDate}
      >
        <span role="img" aria-label="sin fecha" className="text-sm md:text-xs">❌</span>
      </ActionButton>
    </div>
  );

  return (
    <div className={cn(
      'flex gap-1',
      variant === 'kanban' ? 'justify-between w-full' : 'shrink-0 opacity-60 hover:opacity-100 transition-opacity'
    )}>
      {quickActions}
      <div className="flex gap-1">
        <ActionButton
          variant="ghost"
          size="icon"
          className={buttonClassName}
          title="Iniciar tarea"
          onClick={handleRun}
        >
          <Play className={cn(ICON_SIZES.medium, 'md:w-3 md:h-3 text-green-600')} />
        </ActionButton>
        <ActionButton
          variant="ghost"
          size="icon"
          className={buttonClassName}
          title="Editar tarea"
          onClick={handleEdit}
        >
          <Edit className={cn(ICON_SIZES.medium, 'md:w-3 md:h-3 text-muted-foreground')} />
        </ActionButton>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <ActionButton
              variant="ghost"
              size="icon"
              className={cn(buttonClassName, 'hover:bg-red-50')}
              title="Eliminar tarea"
              onClick={(e) => e.stopPropagation()}
            >
              <X className={cn(ICON_SIZES.medium, 'md:w-3 md:h-3 text-red-500')} />
            </ActionButton>
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

TaskActions.displayName = 'TaskActions';

// Main component
export const TaskItem = memo<TaskItemProps>(({
  task,
  onDelete,
  onEdit,
  onView,
  onRun,
  onMove,
  variant = 'list',
  showCategoryLabel = true
}) => {
  const overdue = isTaskOverdue(task.dueDate ?? null);
  const { total, checked } = getCheckboxStats(task.description || '');
  const checkboxProgress = total ? (task.progress ?? (checked / total) * 100) : 0;

  const handleCardClick = useCallback(() => {
    onView?.(task);
  }, [onView, task]);

  const cardClassName = cn(
    'cursor-pointer relative hover:shadow-md transition-all duration-200 border-0 shadow-sm',
    variant === 'kanban' && 'text-sm w-full max-w-none lg:max-w-[18rem]',
    variant === 'list' && 'mb-2',
    task.completed ? (variant === 'kanban' ? 'bg-muted/30' : 'opacity-70 bg-gray-50') : 'bg-white',
    !task.completed && overdue && 'border-l-4 border-l-red-500 bg-red-50',
    variant === 'list' && 'hover:bg-gray-50'
  );

  if (variant === 'kanban') {
    return (
      <>
        <Card onClick={handleCardClick} className={cardClassName}>
          <CardContent className="p-2 md:p-2 flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  {task.isPrivate && <span className="text-xs">🔒</span>}
                  <span className={cn(
                    'text-sm break-words line-clamp-2 font-medium',
                    task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  )}>
                    {task.title}
                  </span>
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
                    variant="kanban"
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
              <TaskActions
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                onRun={onRun}
                variant="kanban"
              />
            </div>
          </CardFooter>
        </Card>
      </>
    );
  }

  // List variant
  return (
    <Card onClick={handleCardClick} className={cardClassName}>
      <CardContent className="flex items-center gap-2.5 py-2 px-3 md:py-2 md:px-3">        
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="space-y-0">
            <div className="flex items-center gap-2">
              {task.isPrivate && <span className="text-xs opacity-70">🔒</span>}
              <span className={cn(
                'text-sm break-words line-clamp-1 leading-tight font-medium',
                task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
              )}>
                {task.title}
              </span>
              {task.description && (
                <AlignLeft className="w-3 h-3 text-muted-foreground shrink-0 opacity-50" />
              )}
            </div>
            
            {task.description && (
              <p className={cn(
                'text-xs text-muted-foreground line-clamp-1 break-words leading-tight',
                task.completed && 'line-through'
              )}>
                {task.description}
              </p>
            )}
          </div>

          <TaskBadges
            task={task}
            showCategoryLabel={showCategoryLabel}
            overdue={overdue}
            variant="list"
          />
        </div>

        <TaskActions
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onRun={onRun}
          variant="list"
        />
      </CardContent>
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';